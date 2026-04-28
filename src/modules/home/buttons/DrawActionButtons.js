import React from 'react';
import {View} from 'react-native';

import useDrawActionButtons from './useDrawActionButtons';
import useDrawGeometryToggle from './useDrawGeometryToggle';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import homeStyles from '../home.style';

const DrawActionButtons = ({clickHandler, mapMode}) => {
  /* Data Hooks */

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

  /* View */

  return (
    <View style={homeStyles.drawToolsContainer}>
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
