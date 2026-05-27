import React, {useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import useDrawActionButtons from './useDrawActionButtons';
import useDrawGeometryToggle from './useDrawGeometryToggle';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {MAP_MODES} from '../../maps/maps.constants';
import homeStyles from '../home.style';

const FAB_SIZE = 45;
const BUTTON_OFFSET = 60;

const DrawActionButtons = ({clickHandler, fab = false, mapMode}) => {
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

  /* Local State */

  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  /* Event Handlers */

  const toggleOpen = () => {
    Animated.spring(animation, {
      friction: 5,
      toValue: isOpen ? 0 : 1,
      useNativeDriver: true,
    }).start();
    setIsOpen(prev => !prev);
  };

  /* Render Functions */

  const getFabButtons = () => {
    const buttons = [
      {
        key: 'point',
        onLongPress: handlePointLongPressed,
        onPress: handlePointPressed,
        source: getImageSource(MAP_MODES.DRAW.POINT),
      },
      {
        key: 'line',
        onLongPress: handleLineLongPressed,
        onPress: handleLinePressed,
        source: getImageSource(MAP_MODES.DRAW.LINE),
      },
      {
        key: 'polygon',
        onLongPress: handlePolygonLongPressed,
        onPress: handlePolygonPressed,
        source: getImageSource(MAP_MODES.DRAW.POLYGON),
      },
      {
        key: 'edit',
        onPress: handleEditShapePressed,
        source: getImageSource(MAP_MODES.EDIT),
      },
    ];
    if (stratSection) {
      buttons.push({
        key: 'interval',
        onPress: handleIntervalDragPressed,
        source: getImageSource(MAP_MODES.INTERVAL_DRAG),
      });
    }
    return buttons;
  };

  /* View */

  if (!fab) {
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
  }

  return (
    <View style={fabStyles.container}>
      {getFabButtons().map(({key, onLongPress, onPress, source}, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(index + 1) * BUTTON_OFFSET],
        });
        return (
          <Animated.View
            key={key}
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[fabStyles.subButton, {opacity: animation, transform: [{translateY}]}]}
          >
            <IconButton
              onLongPress={onLongPress}
              onPress={() => {
                onPress();
                toggleOpen();
              }}
              source={source}
            />
          </Animated.View>
        );
      })}
      <Pressable onPress={toggleOpen} style={fabStyles.trigger}>
        <Text style={fabStyles.triggerLabel}>{isOpen ? '×' : '+'}</Text>
      </Pressable>
    </View>
  );
};

const fabStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  subButton: {
    bottom: 0,
    position: 'absolute',
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: FAB_SIZE / 2,
    elevation: 6,
    height: FAB_SIZE,
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: FAB_SIZE,
  },
  triggerLabel: {
    color: 'black',
    fontSize: 28,
    fontWeight: '300',
  },
});

export default DrawActionButtons;
