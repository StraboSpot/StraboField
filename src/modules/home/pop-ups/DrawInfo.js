import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {isEmpty, truncateText} from '../../../shared/Helpers';
import {PRIMARY_TEXT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../../shared/styles.constants';
import {MAP_MODES} from '../../maps/maps.constants';
import useProject from '../../project/useProject';
import EditCancelSaveButtons from '../buttons/EditCancelSaveButtons';
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
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {getTargetDatasetFromId} = useProject();

  return (
    !isEmpty(targetDatasetId)
    && [MAP_MODES.DRAW.POINT, MAP_MODES.DRAW.LINE, MAP_MODES.DRAW.FREEHANDLINE, MAP_MODES.DRAW.FREEHANDPOLYGON,
      MAP_MODES.DRAW.POLYGON, MAP_MODES.DRAW.MEASURE, MAP_MODES.EDIT].includes(mapMode)
    && (
      <View style={homeStyles.targetDatasetContainer}>
        {mapMode === MAP_MODES.DRAW.MEASURE ? (
            <Text style={{textAlign: 'center'}}>Total Distance: {distance.toFixed(3)}km</Text>
          )
          : mapMode !== MAP_MODES.EDIT && !selectingMode && (
          <>
            <Text style={{textAlign: 'center'}}>Target Dataset:</Text>
            <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
              {truncateText(getTargetDatasetFromId().name, 20)}
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
              ) : (
                <>
                  <Button
                    buttonStyle={homeStyles.drawToolsButtons}
                    containerStyle={{alignContent: 'center'}}
                    disabledStyle={{backgroundColor: 'grey'}}
                    onPress={onEndDrawPressed}
                    title={selectingMode ? 'Set Area' : 'Save New Spot'}
                    titleStyle={homeStyles.drawToolsTitle}
                    type={'clear'}
                  />
                  <Button
                    buttonStyle={{...homeStyles.drawToolsButtons, backgroundColor: SECONDARY_BACKGROUND_COLOR}}
                    containerStyle={{alignContent: 'center', paddingTop: 5}}
                    onPress={onCancel}
                    title={'Cancel'}
                    titleStyle={{...homeStyles.drawToolsTitle, color: PRIMARY_TEXT_COLOR}}
                    type={'clear'}
                  />
                </>
              )}
        </View>
      </View>
    )
  );
};

export default DrawInfo;
