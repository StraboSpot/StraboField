import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  View,
} from 'react-native';

import { COMPASS_TOGGLE_BUTTONS } from './compass.constants';
import compassStyles from './compass.styles';

const CompassFace = ({ compassMeasurementTypes, compassData, grabMeasurements }) => {
  const [strikeSpinValue] = useState(new Animated.Value(0));
  const [trendSpinValue] = useState(new Animated.Value(0));

  const strike = compassData?.strike ?? 0;
  const trend = compassData?.trend ?? 0;

  // Animate STRIKE rotation
  useEffect(() => {
    if (strike >= 0) {
      Animated.timing(strikeSpinValue, {
        toValue: strike,
        duration: 250,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [strike]);

  // Animate TREND rotation
  useEffect(() => {
    if (trend >= 0) {
      Animated.timing(trendSpinValue, {
        toValue: trend,
        duration: 250,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [trend]);

  // Interpolated angles
  const strikeSpin = strikeSpinValue.interpolate({
    inputRange: [0, strike],
    outputRange: ['0deg', strike + 'deg'],
  });

  const trendSpin = trendSpinValue.interpolate({
    inputRange: [0, trend],
    outputRange: ['0deg', trend + 'deg'],
  });

  const renderStrikeDipSymbol = () => {
    return (
      <Animated.Image
        resizeMode='contain'
        source={require('../../assets/images/compass/strike-dip-centered.png')}
        style={[
          compassStyles.strikeAndDipLine,
          { position: 'absolute', transform: [{ rotate: strikeSpin }] },
        ]}
      />
    );
  };

  const renderTrendSymbol = () => {
    return (
      <Animated.Image
        resizeMode='contain'
        source={require('../../assets/images/compass/trendLine.png')}
        style={[
          compassStyles.trendLine,
          { position: 'absolute', transform: [{ rotate: trendSpin }] },
        ]}
      />
    );
  };

  const renderCompassSymbols = () => {
    const linearOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);
    const planarOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);

    if (linearOn && planarOn && trend >= 0 && strike >= 0) {
      return [renderTrendSymbol(), renderStrikeDipSymbol()];
    }
 else if (linearOn) {
      return renderTrendSymbol();
    }
 else if (planarOn) {
      return renderStrikeDipSymbol();
    }

    return null;
  };

  return (
    <View style={compassStyles.compassImageContainer}>
      <Pressable onPress={() => grabMeasurements(true)}>
        <ImageBackground
          source={require('../../assets/images/compass/compass.png')}
          style={compassStyles.compassImage}
        >
          {renderCompassSymbols()}
        </ImageBackground>
      </Pressable>
    </View>
  );
};

export default CompassFace;
