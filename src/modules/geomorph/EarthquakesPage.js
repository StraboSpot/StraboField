import React, {useEffect, useState} from 'react';
import {FlatList, View} from 'react-native';

import {batch, useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalVisible} from '../home/home.slice';
import BasicListItem from '../page/BasicListItem';
import BasicPageDetail from '../page/BasicPageDetail';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const EarthquakesPage = ({page}) => {
  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState({});

  const attributes = spot && spot.properties && spot.properties[page.key] || [];

  useEffect(() => {
    console.log('UE EarthquakesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (!isEmpty(selectedAttributes)) {
      setSelectedAttribute(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  const addAttribute = () => {
    batch(() => {
      setIsDetailView(true);
      setSelectedAttribute({id: getNewUUID()});
      dispatch(setModalVisible({modal: null}));
    });
  };

  const editAttribute = (attribute, i) => {
    if (!attribute.id) {
      let editedEarthquakeData = JSON.parse(JSON.stringify(spot.properties[page.key]));
      attribute = {...attribute, id: getNewUUID()};
      editedEarthquakeData[page.key].splice(i, 1, attribute);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: page.key, value: editedEarthquakeData}));
    }
    setIsDetailView(true);
    setSelectedAttribute(attribute);
    dispatch(setModalVisible({modal: null}));
  };

  const renderAttributeDetail = () => {
    return (
      <BasicPageDetail
        closeDetailView={() => setIsDetailView(false)}
        page={page}
        selectedFeature={selectedAttribute}
      />
    );
  };

  const renderAttributesMain = () => {
    return (
      <View style={{flex: 1, justifyContent: 'flex-start'}}>
        <ReturnToOverviewButton/>
        <SectionDividerWithRightButton
          dividerText={page.label}
          onPress={addAttribute}
        />
        <FlatList
          keyExtractor={(item, index) => index.toString()}
          data={attributes}
          renderItem={({item, index}) => (
            <BasicListItem
              item={item}
              index={index}
              page={page}
              editItem={itemToEdit => editAttribute(itemToEdit, index)}
            />
          )}
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No ' + page.label}/>}
        />
      </View>
    );
  };

  return (
    <>
      {isDetailView ? renderAttributeDetail() : renderAttributesMain()}
    </>
  );
};

export default EarthquakesPage;
