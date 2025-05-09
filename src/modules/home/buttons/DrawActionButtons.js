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
        source={getImageSource(MAP_MODES.DRAW.POINT)}
        onPress={handlePointPressed}
        onLongPress={handlePointLongPressed}
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
      />
      <IconButton
        source={getImageSource(MAP_MODES.DRAW.LINE)}
        onPress={handleLinePressed}
        // onLongPress={handleLineLongPressed}  TODO: Add this back in after fixing  bug with freehand drawing
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
      />
      <IconButton
        source={getImageSource(MAP_MODES.DRAW.POLYGON)}
        onPress={handlePolygonPressed}
        // onLongPress={handlePolygonLongPressed}   TODO: Add this back in after fixing  bug with freehand drawing
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
      />
      <IconButton
        source={getImageSource(MAP_MODES.EDIT)}
        onPress={handleEditShapePressed}
        imageStyle={SMALL_SCREEN && homeStyles.iconSizeSmallScreen}
      />
    </View>
  );
};

export default DrawActionButtons;
