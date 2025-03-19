import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import {Button} from 'react-native-elements';
import JSONTree from 'react-native-json-tree';

import forms from '../../assets/forms';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import Modal from '../../shared/ui/modal/Modal';
import SectionDivider from '../../shared/ui/SectionDivider';

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
        id: 'ID',
        modified_timestamp: 'Date Object',
        name: 'Spot Name',
        notes: 'Notes',
        notesTimestamp: 'Date Object',
        time: 'ISOString Date',
      },
    };

    // Get forms
    Object.entries(forms).map(([categoryKey, formsInCategory]) => {

      if (categoryKey !== 'project' && categoryKey !== 'measurement_bulk' && categoryKey !== 'preferences') {
        let geographyTemp = {};

        // Get forms for a category
        const formsObj = Object.entries(formsInCategory).reduce((acc1, [formKey, formValue]) => {

          if (formKey !== 'project_description' && formKey !== 'user_profile') {

            // Get survey fields
            const survey = formValue.survey.reduce((acc2, field) => {
              if (field.name && field.name !== 'start' && field.name !== 'end' && field.name !== '__version__' && field.name !== '_version_') {
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

            if (formKey === 'geography') {
              geographyTemp = survey;
              return acc1;
            }
            else return {...acc1, ...{[formKey]: survey}};
          }
          else return acc1;
        }, {});

        if (!isEmpty(formsObj)) {
          // console.log('categoryKey:', categoryKey, 'Form:', formsObj);

          if (categoryKey === 'general') {
            spotDataModelTemp = {...spotDataModelTemp, properties: {...spotDataModelTemp.properties, ...formsObj, ...geographyTemp}};
          }
          else if (categoryKey === 'measurement') {
            spotDataModelTemp = {
              ...spotDataModelTemp,
              properties: {...spotDataModelTemp.properties, orientation_data: formsObj},
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

  return (
    <Modal closeModal={close} isFullScreen title={'Spot Data Model Object'}>
      <ScrollView>
        <Button
          title={'Copy JSON to Clipboard'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
          onPress={() => Clipboard.setString(JSON.stringify(spotDataModel))}
        />
        <JSONTree data={spotDataModel} hideRoot/>
      </ScrollView>
    </Modal>
  );
};

export default SpotDataModelModal;
