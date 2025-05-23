import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {isEmpty, truncateText} from '../../../shared/Helpers';
import {MAP_MODES} from '../../maps/maps.constants';
import useProject from '../../project/useProject';
import EditCancelSaveButtons from '../buttons/EditCancelSaveButtons';
import homeStyles from '../home.style';

const DrawInfo = ({
                    clickHandler,
                    distance,
                    endMeasurement,
                    mapMode,
                    onEndDrawPressed,
                    selectingMode,
                  }) => {
  const selectedDatasetId = useSelector(state => state.project.selectedDatasetId);

  const {getSelectedDatasetFromId} = useProject();

  return (
    !isEmpty(selectedDatasetId)
    && [MAP_MODES.DRAW.POINT, MAP_MODES.DRAW.LINE, MAP_MODES.DRAW.FREEHANDLINE, MAP_MODES.DRAW.FREEHANDPOLYGON,
      MAP_MODES.DRAW.POLYGON, MAP_MODES.DRAW.MEASURE, MAP_MODES.EDIT].includes(mapMode)
    && (
      <View style={homeStyles.selectedDatasetContainer}>
        {mapMode === MAP_MODES.DRAW.MEASURE ? (
            <Text style={{textAlign: 'center'}}>Total Distance: {distance.toFixed(3)}km</Text>
          )
          : mapMode !== MAP_MODES.EDIT && !selectingMode && (
          <>
            <Text style={{textAlign: 'center'}}>Selected Dataset:</Text>
            <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
              {truncateText(getSelectedDatasetFromId().name, 20)}
            </Text>
          </>
        )}
        <View>
          {mapMode === MAP_MODES.EDIT ? <EditCancelSaveButtons clickHandler={clickHandler}/>
            : mapMode === MAP_MODES.DRAW.POINT ? (
                <View>
                  <Text style={{textAlign: 'center'}}>Place a point </Text>
                  <Text style={{textAlign: 'center'}}>on the map</Text>
                </View>
              )
              : mapMode === MAP_MODES.DRAW.MEASURE ? (
                  <Button
                    buttonStyle={homeStyles.drawToolsButtons}
                    containerStyle={{alignContent: 'center'}}
                    onPress={endMeasurement}
                    title={'End Measurement'}
                    titleStyle={homeStyles.drawToolsTitle}
                    type={'clear'}
                  />
                )
                : (
                  <Button
                    buttonStyle={homeStyles.drawToolsButtons}
                    containerStyle={{alignContent: 'center'}}
                    onPress={onEndDrawPressed}
                    title={selectingMode ? 'Set Area' : 'Save New Spot'}
                    titleStyle={homeStyles.drawToolsTitle}
                    type={'clear'}
                  />
                )
          }
        </View>
      </View>
    )
  );
};

export default DrawInfo;
