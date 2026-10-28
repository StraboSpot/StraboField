import React from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setActiveModal} from '../home/home.slice';
import FeatureDetail from '../page/FeatureDetail';
import FeatureListItem from '../page/FeatureListItem';
import PageHeader from '../page/PageHeader';
import useFeatureDetailView from '../page/useFeatureDetailView';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const EarthquakesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeDetailView, isDetailView, openDetailView, selectedFeature} = useFeatureDetailView();

  /* Derived Variables */

  const attributes = spot && spot.properties && spot.properties[page.key] || [];

  /* Logic Helpers */

  const addAttribute = () => {
    dispatch(setActiveModal({modal: page.key}));
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedEarthquakeData = JSON.parse(JSON.stringify(spot.properties[page.key]));
      attribute = {...attribute, id: getNewUUID()};
      editedEarthquakeData.splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: page.key, value: editedEarthquakeData}));
    }
    openDetailView(attribute);
  };

  /* Render Functions */

  const renderAttributeDetail = () => {
    return (
      <FeatureDetail
        closeDetailView={closeDetailView}
        isReadOnly={isReadOnly}
        page={page}
        selectedFeature={selectedFeature}
      />
    );
  };

  const renderAttributesMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <PageHeader onPressAdd={addAttribute} pageTitle={page.label} showAddButton={!isReadOnly}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText onPress={!isReadOnly && addAttribute} text={'No ' + page.label}/>}
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

export default EarthquakesPage;
