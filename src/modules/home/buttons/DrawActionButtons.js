import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import useDrawActionButtons from './useDrawActionButtons';
import useDrawGeometryToggle from './useDrawGeometryToggle';
import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import useSpots from '../../spots/useSpots';
import homeStyles from '../home.style';

const DrawActionButtons = ({clickHandler, mapMode}) => {
  /* Data Hooks */

  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  const {
    getImageSource,
    handleEditShapePressed,
    handleIntervalDragPressed,
    handleLinePressed,
    handlePointPressed,
    handlePolygonPressed,
    stratSection,
  } = useDrawActionButtons({clickHandler, mapMode});
  const {handleLineLongPressed, handlePointLongPressed, handlePolygonLongPressed} = useDrawGeometryToggle();
  const {isCurrentMapReadOnly} = useSpots();

  /* Derived Variables */

  // Drawing files its new Spot into the target dataset and saveEdits discards the edit without one, so
  // neither tool is offered until a target is set
  const hasTargetDataset = !isEmpty(targetDatasetId);

  /* View */

  // A read only image basemap or strat section takes every draw tool with it, the interval drag included.
  // With nothing left to show, render null - an empty row would still paint its divider on small screens.
  if (isCurrentMapReadOnly() || (!hasTargetDataset && !stratSection)) return null;

  return (
    <View style={[homeStyles.drawToolsContainer, SMALL_SCREEN && homeStyles.smallScreenDrawActionButtons]}>
      {hasTargetDataset && (
        <>
          <IconButton
            imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
            onLongPress={handlePointLongPressed}
            onPress={handlePointPressed}
            source={getImageSource(MAP_MODES.DRAW.POINT)}
          />
          <IconButton
            imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
            onLongPress={handleLineLongPressed}
            onPress={handleLinePressed}
            source={getImageSource(MAP_MODES.DRAW.LINE)}
          />
          <IconButton
            imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
            onLongPress={handlePolygonLongPressed}
            onPress={handlePolygonPressed}
            source={getImageSource(MAP_MODES.DRAW.POLYGON)}
          />
          <IconButton
            imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
            onPress={handleEditShapePressed}
            source={getImageSource(MAP_MODES.EDIT)}
          />
        </>
      )}
      {stratSection && (
        <IconButton
          imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
          onPress={handleIntervalDragPressed}
          source={getImageSource(MAP_MODES.INTERVAL_DRAG)}
        />
      )}
    </View>
  );
};

export default DrawActionButtons;
