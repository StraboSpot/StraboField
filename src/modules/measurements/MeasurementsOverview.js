import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import MeasurementItem from './MeasurementItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const MeasurementsOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const orientationsData = useSelector(state => state.spot.selectedSpot.properties.orientation_data);

  /* Event Handlers */

  const onMeasurementPressed = (item) => {
    dispatch(setSelectedAttributes([item]));
    dispatch(setNotebookPageVisible(page.key));
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={
        <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={'No Measurements'}/>
      }
      data={orientationsData}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => (
        <MeasurementItem
          item={item}
          onPress={() => onMeasurementPressed(item)}
          selectedIds={[]}
        />
      )}
    />
  );
};

export default MeasurementsOverview;

