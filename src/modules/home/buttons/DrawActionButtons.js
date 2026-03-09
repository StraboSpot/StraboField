import React from 'react';
import {View} from 'react-native';

import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import homeStyles from '../home.style';
import useDrawActionButtons from './useDrawActionButtons';
import useDrawGeometryToggle from './useDrawGeometryToggle';

const DrawActionButtons = ({clickHandler, mapMode}) => {
  /* Data Hooks */

  const {
    getImageSource,
    handleEditShapePressed,
    handleLinePressed,
    handlePointPressed,
    handlePolygonPressed,
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
    </View>
  );
};

export default DrawActionButtons;
