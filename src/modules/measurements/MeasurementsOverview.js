import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import MeasurementItem from './MeasurementItem';
import {getMeasurementsInSectionOrder} from './measurements.helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {openFeatureInNotebook} from '../notebook-panel/notebook.helpers';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';

const MeasurementsOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const orientationsData = useSelector(state => state.spot.selectedSpot.properties.orientation_data);

  /* Derived Variables */

  // Grouped and ordered as the Measurements page lists them, just without the section headers
  const orientationsDataInSectionOrder = getMeasurementsInSectionOrder(orientationsData);

  /* Event Handlers */

  const onMeasurementPressed = item => openFeatureInNotebook(dispatch, page.key, item);

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={
        <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={'No Measurements'}/>
      }
      data={orientationsDataInSectionOrder}
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

