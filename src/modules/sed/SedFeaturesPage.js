import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {INTERPRETATIONS_SUBPAGES, LITHOLOGY_SUBPAGES, STRUCTURE_SUBPAGES} from './sed.constants';
import {isLithologyRequiredForInterval} from './sed.helpers';
import {getNewUUID} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import useForm from '../form/useForm';
import FeatureDetail from '../page/FeatureDetail';
import FeatureListItem from '../page/FeatureListItem';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import SubpageTabs from '../page/SubpageTabs';
import useFeatureDetailView from '../page/useFeatureDetailView';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const SedFeaturesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();
  const {getLabel, getSiblingSurvey} = useForm();

  /* Local State */

  const [invalidFields, setInvalidFields] = useState([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);

  /* Derived Variables */

  const attributes = spot && spot.properties && spot.properties.sed && spot.properties.sed[page.key] || [];
  const intervalCharacter = spot?.properties?.sed?.character;
  // There is no field to mark the requirement on, and the empty list is the only place it is ever live
  const isLithologyRequired = page.key === PAGE_KEYS.LITHOLOGIES && isLithologyRequiredForInterval(spot);
  const emptyListText = 'No ' + page.label + (isLithologyRequired
    ? '.\n\nAt least one is required for ' + getLabel(intervalCharacter, ['sed', 'interval']) + ' intervals.'
    : '');

  /* Logic Helpers */

  const addAttribute = () => openDetailView({id: getNewUUID()});

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      attribute = {...attribute, id: getNewUUID()};
      editedSedData[page.key].splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    openDetailView(attribute);
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    const subpages = page.key === PAGE_KEYS.LITHOLOGIES ? LITHOLOGY_SUBPAGES
      : page.key === PAGE_KEYS.STRUCTURES ? STRUCTURE_SUBPAGES
        : page.key === PAGE_KEYS.INTERPRETATIONS ? INTERPRETATIONS_SUBPAGES
          : undefined;
    if (subpages) {
      const subpageKeys = Object.values(subpages);
      const subpageKey = subpageKeys[selectedTypeIndex];
      // Every tab edits the same attribute, so a choice made on one can leave a field on another behind, and a
      // field another asks for is unanswered wherever you are standing. Both are checked against these
      const siblingSurvey = getSiblingSurvey(['sed', subpageKey], subpageKeys);
      return (
        <FeatureDetail
          PageTabsComponent={
            <SubpageTabs
              formCategory={'sed'}
              invalidFields={invalidFields}
              onPress={i => setSelectedTypeIndex(i)}
              selectedIndex={selectedTypeIndex}
              subpageKeys={subpageKeys}
            />
          }
          closeDetailView={closeDetailView}
          groupKey={'sed'}
          isReadOnly={isReadOnly}
          page={{...page, key: subpageKey}}
          selectedFeature={selectedFeature}
          setInvalidFields={setInvalidFields}
          siblingSurvey={siblingSurvey}
        />
      );
    }
    else {
      return (
        <FeatureDetail
          closeDetailView={closeDetailView}
          groupKey={'sed'}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selectedFeature}
        />
      );
    }
  };

  const renderAttributesMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader onPressAdd={addAttribute} pageTitle={page.label} showAddButton={!isReadOnly}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={
            <ListEmptyText onPress={!isReadOnly && addAttribute} text={emptyListText}/>
          }
          data={attributes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (
            <FeatureListItem
              editItem={itemToEdit => editAttribute(itemToEdit, index)}
              index={index}
              item={item}
              page={page}
            />
          )}
        />
      </View>
    );
  };

  /* View */

  return isDetailView ? renderAttributeDetail() : renderAttributesMain();
};

export default SedFeaturesPage;
