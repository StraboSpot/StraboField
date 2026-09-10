import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground, Platform, Pressable, View} from 'react-native';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import compassStyles from './compass.styles';
import {mod} from '../../services/device/compassMath.helpers';

const CompassFace = ({compassMeasurementTypes, compassData, grabMeasurements}) => {
  /* Local State */

  const strikeSpinValue = useRef(new Animated.Value(0)).current;
  const trendSpinValue = useRef(new Animated.Value(0)).current;
  const strikeDisplayed = useRef(0);
  const trendDisplayed = useRef(0);

  /* Derived Variables */

  const strike = compassData?.strike ?? 0;
  const trend = compassData?.trend ?? 0;
  const strikeSpin = strikeSpinValue.interpolate({
    extrapolate: 'extend',
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });
  const trendSpin = trendSpinValue.interpolate({
    extrapolate: 'extend',
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  /* Side Effects */

  const animateNeedle = (animatedValue, displayedRef, target) => {
    const delta = mod(target - displayedRef.current + 180, 360) - 180; // signed shortest turn in (-180, 180]
    displayedRef.current += delta;
    Animated.timing(animatedValue, {
      duration: 200,
      easing: Easing.out(Easing.quad),
      toValue: displayedRef.current,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  useEffect(() => {
    if (strike >= 0) animateNeedle(strikeSpinValue, strikeDisplayed, strike);
  }, [strike]);

  useEffect(() => {
    if (trend >= 0) animateNeedle(trendSpinValue, trendDisplayed, trend);
  }, [trend]);

  /* Render Functions */

  const renderCompassSymbols = () => {
    const linearOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);
    const planarOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);

    if (linearOn && planarOn && trend >= 0 && strike >= 0) return <>{renderTrendSymbol()}{renderStrikeDipSymbol()}</>;
    else if (linearOn) return renderTrendSymbol();
    else if (planarOn) return renderStrikeDipSymbol();
    return null;
  };

  const renderStrikeDipSymbol = () => {
    return (
      <Animated.Image
        resizeMode={'contain'}
        source={require('../../assets/images/compass/strike-dip-centered.png')}
        style={[
          compassStyles.strikeAndDipLine,
          {position: 'absolute', transform: [{rotate: strikeSpin}]},
        ]}
      />
    );
  };

  const renderTrendSymbol = () => {
    return (
      <Animated.Image
        resizeMode={'contain'}
        source={require('../../assets/images/compass/trendLine.png')}
        style={[
          compassStyles.trendLine,
          {position: 'absolute', transform: [{rotate: trendSpin}]},
        ]}
      />
    );
  };

  /* View */

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
