import React, {useEffect, useRef, useState} from 'react';
import {SectionList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {
  ALTERATION_ORE_SECTION_TITLE,
  FAULT_SECTION_TITLE,
  IGNEOUS_SECTION_TITLES,
  METAMORPHIC_SECTION_TITLE,
  SEDIMENTARY_SECTION_TITLE,
} from './petrology.constants';
import commonStyles from '../../shared/common.styles';
import {getNewUUID, isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {FormikWrapper, SelectInputField, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedSpotProperties} from '../spots/spots.slice';

const RockPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getSurvey} = useForm();
  const {getSpotById, getSpotsWithKey} = useSpots();

  /* Local State */

  const preFormRef = useRef(null);

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedRock, setSelectedRock] = useState({});
  const [spotsWithRockType, setSpotsWithRockType] = useState([]);

  /* Derived Variables */

  const groupKey = page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? 'sed' : 'pet';
  const pageKey = page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? PAGE_KEYS.LITHOLOGIES : page.key;
  const pageSectionsTitles = pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS ? IGNEOUS_SECTION_TITLES
    : pageKey === PAGE_KEYS.ROCK_TYPE_METAMORPHIC ? METAMORPHIC_SECTION_TITLE
      : pageKey === PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE ? ALTERATION_ORE_SECTION_TITLE
        : pageKey === PAGE_KEYS.ROCK_TYPE_FAULT ? FAULT_SECTION_TITLE
          : SEDIMENTARY_SECTION_TITLE;
  const rockData = spot.properties[groupKey] || {};

  /* Side Effects */

  useEffect(() => {
    console.log('UE RockPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedRock({});
    else {
      setSelectedRock(selectedAttributes[0]);
      setIsDetailView(true);
    }
    getSpotsWithRockType();
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const addRock = (sectionKey) => {
    let newRock = pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS ? {id: getNewUUID(), igneous_rock_class: sectionKey}
      : {id: getNewUUID()};
    dispatch(setModalValues(newRock));
    dispatch(setModalVisible({modal: page.key}));
  };

  const copyPetData = (spotId) => {
    const spotToCopy = getSpotById(spotId);

    const copyPetDataContinued = () => {
      let updatedPetData = JSON.parse(JSON.stringify(rockData));
      if (groupKey === 'pet' && spotToCopy?.properties?.pet?.rock_type) {
        const survey = getSurvey(['pet_deprecated', pageKey]);
        const fieldNames = survey.reduce((acc, field) => field.name ? [...acc, field.name] : acc, []);
        const petDataToCopyFiltered = Object.entries(spotToCopy.properties.pet).reduce((acc, [key, value]) => {
          return fieldNames.includes(key) ? {...acc, [key]: value} : acc;
        }, {});
        const petDataFiltered = Object.entries(rockData).reduce((acc, [key, value]) => {
          return fieldNames.includes(key) ? acc : {...acc, [key]: value};
        }, {});
        const updatedRockType = rockData.rock_type ? [...new Set([...rockData.rock_type, pageKey])]
          : [pageKey];
        updatedPetData = {...petDataFiltered, ...petDataToCopyFiltered, rock_type: updatedRockType};
      }
      if (spotToCopy.properties[groupKey] && spotToCopy.properties[groupKey][pageKey]) {
        const copyDataWithNewIds = spotToCopy.properties[groupKey][pageKey].map(
          r => ({...r, id: getNewUUID()}));
        updatedPetData[pageKey] = [...rockData[pageKey] || [], ...copyDataWithNewIds];
      }
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: groupKey, value: updatedPetData}));
    };

    if (!isEmpty(spotToCopy)) {
      const title = page.label;
      console.log('Copying ' + title + ' data from Spot:', spotToCopy);
      if (groupKey === 'pet' && spotToCopy?.properties?.pet?.rock_type?.includes(pageKey)
        && rockData?.rock_type?.includes(pageKey)) {
        alert('Overwrite Existing Data',
          'Are you sure you want to overwrite any current ' + title + ' rock data '
          + 'with the ' + title + ' rock data from ' + spotToCopy.properties.name + '?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => preFormRef.current.resetForm(),
            },
            {
              text: 'Yes',
              onPress: () => copyPetDataContinued(),
            },
          ],
          {cancelable: false},
        );
      }
      else copyPetDataContinued();
    }
    else console.log('Spot to copy is empty. Aborting copying.');
  };

  const editRock = (rock, i) => {
    if (!rock.id) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      rock = {...rock, id: getNewUUID()};
      editedSedData[pageKey].splice(i, 1, rock);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    setIsDetailView(true);
    setSelectedRock(rock);
    dispatch(setModalVisible({modal: null}));
  };

  const getSpotsWithRockType = () => {
    const allActiveSpotsWithGroupKey = getSpotsWithKey(groupKey);
    setSpotsWithRockType(allActiveSpotsWithGroupKey.filter(s => s.properties.id !== spot.properties.id
      && (s.properties[groupKey]
        && (s.properties[groupKey].rock_type?.includes(pageKey) || s.properties[groupKey][pageKey]))));
  };

  /* Render Functions */

  const renderCopySelect = () => {
    // Sort reverse chronologically
    const spotsWithRockTypeSorted = spotsWithRockType.sort(((a, b) => {
      return new Date(b.properties.date) - new Date(a.properties.date);
    }));
    const label = 'Copy ' + page.label + ' Data From:';
    return (
      <FormikWrapper initialValues={{}} innerRef={preFormRef}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <SelectInputField
              choices={spotsWithRockTypeSorted.map(s => ({label: s.properties.name, value: s.properties.id}))}
              isSingleSelect={true}
              label={label}
              name={'spot_id_for_pet_copy'}
              onValueChanged={(name, value) => copyPetData(value)}
            />
          </ListItem.Content>
        </ListItem>
      </FormikWrapper>
    );
  };

  const renderRockDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        groupKey={groupKey}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedRock}
      />
    );
  };

  const renderRockMain = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader pageTitle={page.label}/>
        {!isReadOnly && renderCopySelect()}
        {renderSections()}
      </View>
    );
  };

  const renderSectionHeader = (sectionTitle, sectionKey) => {
    if (sectionKey !== 'deprecated' && !isReadOnly) {
      return (
        <SectionDividerWithRightButton
          dividerText={sectionTitle}
          onPress={() => addRock(sectionKey)}
        />
      );
    }
    else return <SectionDivider dividerText={sectionTitle}/>;
  };

  const renderSections = () => {
    const rocksGrouped = Object.entries(pageSectionsTitles).reduce((acc, [key, title]) => {
      const data = key !== 'deprecated' ? spot?.properties[groupKey] && spot?.properties[groupKey][pageKey]
        && Array.isArray(spot?.properties[groupKey][pageKey])
        && spot?.properties[groupKey][pageKey].filter(
          rock => key === pageKey || rock.igneous_rock_class === key) || []
        : spot?.properties[groupKey] && spot?.properties[groupKey].rock_type?.includes(pageKey)
          ? [spot.properties[groupKey]]
          : [];
      return key === 'deprecated' && isEmpty(data) ? acc : [...acc, {title, key, data: data.reverse()}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item, index}) => (
          <BasicListItem
            editItem={itemToEdit => editRock(itemToEdit, index)}
            item={item}
            page={page}
          />
        )}
        renderSectionFooter={({section}) => {
          return (
            section.data.length === 0 && (
              <ListEmptyText
                onPress={!isReadOnly && section.key !== 'deprecated' && (() => addRock(section.key))}
                text={'No ' + section.title}
              />
            )
          );
        }}
        renderSectionHeader={({section: {title, key}}) => renderSectionHeader(title, key)}
        sections={rocksGrouped}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  /* View */

  return isDetailView ? renderRockDetail() : renderRockMain();
};

export default RockPage;
