import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {isEmpty, truncateText} from '../../../shared/Helpers';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import {MAP_MODES} from '../../maps/maps.constants';
import useProject from '../../project/useProject';
import EditCancelSaveButtons from '../buttons/EditCancelSaveButtons';
import IntervalDragCancelSaveButtons from '../buttons/IntervalDragCancelSaveButtons';
import homeStyles from '../home.style';

const DrawInfo = ({
                    clickHandler,
                    distance,
                    endMeasurement,
                    mapMode,
                    onCancel,
                    onEndDrawPressed,
                    selectingMode,
                  }) => {
  /* Data Hooks */

  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {getTargetDatasetFromId} = useProject();

  /* View */

  return (
    (mapMode === MAP_MODES.INTERVAL_DRAG
      || (!isEmpty(targetDatasetId)
        && [MAP_MODES.DRAW.POINT, MAP_MODES.DRAW.LINE, MAP_MODES.DRAW.FREEHANDLINE, MAP_MODES.DRAW.FREEHANDPOLYGON,
          MAP_MODES.DRAW.POLYGON, MAP_MODES.DRAW.MEASURE, MAP_MODES.EDIT].includes(mapMode)))
    && (
      <View style={homeStyles.targetDatasetContainer}>
        {mapMode === MAP_MODES.DRAW.MEASURE ? (
            <Text style={{textAlign: 'center', paddingTop: 10}}>Total Distance: {distance.toFixed(3)}km</Text>
          )
          : mapMode !== MAP_MODES.EDIT && mapMode !== MAP_MODES.INTERVAL_DRAG && !selectingMode && (
          <View style={{paddingTop: 10}}>
            <Text style={{textAlign: 'center'}}>Target Dataset:</Text>
            <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
              {truncateText(getTargetDatasetFromId().name, 20)}
            </Text>
          </View>
        )}
        <View>
          {mapMode === MAP_MODES.INTERVAL_DRAG ? <IntervalDragCancelSaveButtons clickHandler={clickHandler}/>
            : mapMode === MAP_MODES.EDIT ? <EditCancelSaveButtons clickHandler={clickHandler}/>
              : mapMode === MAP_MODES.DRAW.POINT ? (
                  <View>
                    <Text style={{textAlign: 'center'}}>Place a point </Text>
                    <Text style={{textAlign: 'center'}}>on the map</Text>
                  </View>
                )
                : mapMode === MAP_MODES.DRAW.MEASURE ? <ActionButton onPress={endMeasurement} title={'End Measurement'}/>
                  : (
                    <>
                      <View style={{marginBottom: -10}}>
                        <ActionButton
                          onPress={onEndDrawPressed}
                          title={selectingMode ? 'Set Area' : 'Save New Spot'}
                        />
                      </View>
                      <OutlineButton
                        onPress={onCancel}
                        title={'Cancel'}
                      />
                    </>
                  )}
        </View>
      </View>
    )
  );
};

export default DrawInfo;
