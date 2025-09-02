import React from 'react';
import {View} from 'react-native';

import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import homeStyles from '../home.style';
import useDrawActionButtons from './useDrawActionButtons';

const DrawActionButtons = ({clickHandler, mapMode}) => {

  const {
    getImageSource,
    handleEditShapePressed,
    handleLineLongPressed,
    handleLinePressed,
    handlePointLongPressed,
    handlePointPressed,
    handlePolygonLongPressed,
    handlePolygonPressed,
  } = useDrawActionButtons({clickHandler, mapMode});

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
