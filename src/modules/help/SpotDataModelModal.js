import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import JSONTree from 'react-native-json-tree';

import forms from '../../assets/forms';
import {isEmpty} from '../../shared/Helpers';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const SpotDataModelModal = ({close}) => {

  const [spotDataModel, setSpotDataModel] = useState({});

  useEffect(() => {
    createSpotDataModel();
  }, []);

  const createSpotDataModel = () => {
    console.log('Creating...................................................');

    let spotDataModelTemp = {
      type: 'Feature',
      geometry: {
        'coordinates': {},
        'type': 'Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon or GeometryCollection',
      },
      properties: {
        date: 'ISOString Date',
        id: 'Integer',
        modified_timestamp: 'Unix Timestamp',
        name: 'Spot Name',
        notes: 'Notes',
        notesTimestamp: 'JavaScript Date Object',
        time: 'ISOString Date',
        image_basemap: 'integer id of parent image basemap',
        strat_section_id: 'uuid of parent strat section',
        data: {urls: '[string]', links: '[string]'},
      },
    };

    // Get forms
    Object.entries(forms).map(([categoryKey, formsInCategory]) => {

      if (categoryKey !== 'project' && categoryKey !== 'measurement_bulk' && categoryKey !== 'preferences'
        && categoryKey !== 'settings') {
        let geographyTemp = {};

        // Get forms for a category
        const formsObj = Object.entries(formsInCategory).reduce((acc1, [formKey, formValue], j) => {

          if (formKey !== 'add_interval' && formKey !== 'lithology' && formKey !== 'project_description'
            && formKey !== 'reports' && formKey !== 'user_conventions' && formKey !== 'user_profile') {

            // Get survey fields
            const survey = formValue.survey.reduce((acc2, field) => {
              if (field.type && field.type !== 'start' && field.type !== 'end' && field.type !== 'calculate'
                && field.type !== 'begin_group' && field.type !== 'end_group') {
                let fieldObj = JSON.parse(JSON.stringify(field));

                // Get choices
                if (field?.type.split(' ')[0] === 'select_one' || field?.type.split(' ')[0] === 'select_multiple') {
                  const choices = formValue.choices.filter(choice => choice.list_name === field.type.split(' ')[1]);
                  const choicesObj = choices.reduce((acc3, choice) => ({...acc3, [choice.name]: choice}), {});
                  fieldObj = {...fieldObj, choices: choicesObj};
                }
                return {...acc2, [field.name]: fieldObj};

              }
              else return acc2;
            }, {});

            // console.log(i, formKey, survey);

            if (formKey === 'geography') {
              geographyTemp = survey;
              return acc1;
            }
            else if (formKey === 'plutonic') {
              return {...acc1, igneous: {0: {id: 'uuid', igneous_rock_class: formKey, ...survey}}};
            }
            else if (formKey === 'volcanic') {
              return {...acc1, igneous: {...acc1.igneous, 1: {id: 'uuid', igneous_rock_class: formKey, ...survey}}};
            }
            else if (formKey === 'images' || formKey === 'minerals' || formKey === 'samples') {
              return {...acc1, ...{[formKey]: {id: 'integer', ...survey}}};
            }
            else if (formKey === 'interval') {
              const {character, ...interval} = survey;
              return {...acc1, character: character, ...{[formKey]: {id: 'integer', ...interval}}};
            }
            else if (formKey === 'bedding') {
              return {...acc1, bedding: {...acc1.bedding, beds: survey}};
            }
            else if (formKey === 'bedding_shared_interbedded') {
              return {...acc1, bedding: {...acc1.bedding, 0: survey}};
            }
            else if (formKey === 'bedding_shared_package') {
              return {...acc1, bedding: {...acc1.bedding, 1: survey}};
            }
            else if (formKey === 'architecture' || formKey === 'environment' || formKey === 'process' || formKey === 'surfaces') {
              return {...acc1, interpretations: {...acc1.structures, id: 'uuid', ...survey}};
            }
            else if (formKey === 'bedding_plane' || formKey === 'bioturbation' || formKey === 'pedogenic' || formKey === 'physical') {
              return {...acc1, structures: {...acc1.structures, id: 'uuid', ...survey}};
            }
            else if (formKey === 'lithologies' || formKey === 'composition' || formKey === 'stratification' || formKey === 'texture') {
              return {...acc1, lithologies: {...acc1.lithologies, id: 'uuid', ...survey}};
            }
            else if (categoryKey === 'pet' || categoryKey === 'sed' || formKey === 'earthquakes') {
              return {...acc1, ...{[formKey]: {id: 'uuid', ...survey}}};
            }
            else if (categoryKey === 'tephra') {
              return {...acc1, id: 'uuid', ...survey};
            }
            else if (categoryKey === 'measurement') {
              return {...acc1, ...{[j]: {id: 'uuid', type: formKey, ...survey}}};
            }
            else if (categoryKey === '_3d_structures' || categoryKey === 'fabrics') {
              if (formKey === 'fabric') return {...acc1, ...{DEPRECATED: {id: 'integer', type: formKey, ...survey}}};
              else return {...acc1, ...{[j]: {id: 'integer', type: formKey, ...survey}}};
            }
            else return {...acc1, ...{[formKey]: survey}};
          }
          else return acc1;
        }, {});

        if (!isEmpty(formsObj)) {
          // console.log('categoryKey:', categoryKey, 'Form:', formsObj);

          if (categoryKey === 'general') {
            spotDataModelTemp = {
              ...spotDataModelTemp,
              properties: {...spotDataModelTemp.properties, ...formsObj, ...geographyTemp},
            };
          }
          else if (categoryKey === 'measurement') {
            spotDataModelTemp = {
              ...spotDataModelTemp,
              properties: {...spotDataModelTemp.properties, orientation_data: formsObj},
            };
          }
          else if (categoryKey === 'pet_deprecated') {
            spotDataModelTemp = {
              ...spotDataModelTemp,
              properties: {
                ...spotDataModelTemp.properties,
                pet: {...spotDataModelTemp.properties.pet, DEPRECATED: formsObj},
              },
            };
          }
          else {
            spotDataModelTemp = {
              ...spotDataModelTemp,
              properties: {...spotDataModelTemp.properties, [categoryKey]: formsObj},
            };
          }
        }
      }
    });

    setSpotDataModel(spotDataModelTemp);
  };

  const shouldExpandNode = (keyName, data, level) => {
    // Since hideRoot is true, level 0 is actually the first visible level
    // Level 0: type, geometry, properties
    // Level 1: contents of properties (what we want to show)
    return level <= 1;
  };

  return (
    <ModalWrapper
      closeModal={close}
      headerTitle={'Spot Data Model Object'}
      overlayStyleOverride={{width: '40%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <ScrollView>
        <ClearButton
          onPress={() => Clipboard.setString(JSON.stringify(spotDataModel))}
          title={'Copy JSON to Clipboard'}
        />
        <JSONTree data={spotDataModel} hideRoot shouldExpandNode={shouldExpandNode}/>
      </ScrollView>
    </ModalWrapper>
  );
};

export default SpotDataModelModal;
