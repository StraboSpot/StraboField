import React, {useState} from 'react';
import {Animated, Easing, ImageBackground, Platform, Pressable, View} from 'react-native';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import compassStyles from './compass.styles';

const CompassFace = ({compassMeasurementTypes, compassData, grabMeasurements}) => {

  const strikeAndDipStyles = [compassStyles.strikeAndDipLine];
  const trendAndPlungeStyles = [compassStyles.trendLine];

  const [strikeSpinValue] = useState(new Animated.Value(0));
  const [trendSpinValue] = useState(new Animated.Value(0));

  const renderCompassSymbols = () => {
    // console.log('Strike', compassData.strike + '\n' + 'Trend', compassData.trend);
    const linearToggleOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);
    const planerToggleOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);

    if (linearToggleOn && planerToggleOn && compassData.trend !== null && compassData.strike !== null) {
      strikeAndDipStyles.push({position: 'absolute'});
      return [renderTrendSymbol(), renderStrikeDipSymbol()];
    }
    else if (linearToggleOn) return renderTrendSymbol();
    if (planerToggleOn) return renderStrikeDipSymbol();
  };

  // Render the strike and dip symbol inside the compass
  const renderStrikeDipSymbol = () => {
    let spin;
    const strike = compassData.strike || 0; // iOS already sets the strike with magnetic declination natively
    let image = require('../../assets/images/compass/strike-dip-centered.png');
    if (strike >= 0) {
      spin = strikeSpinValue.interpolate({
        inputRange: [0, strike],
        // inputRange: [0, 360], // Changed to get symbols to render while we figure out the android compass
        outputRange: ['0deg', strike + 'deg'],
        // outputRange: ['0deg', 180 + 'deg'], // Changed to get symbols to render while we figure out the android compass
      });

      strikeAndDipStyles.push({transform: [{rotate: spin}]});
      // First set up animation

      Animated.timing(
        strikeSpinValue,
        {
          duration: 100,
          toValue: strike,
          easing: Easing.linear(),
          useNativeDriver: Platform.OS !== 'web',
        },
      ).start();

      return (
        <Animated.Image
          key={image}
          source={image}
          style={strikeAndDipStyles}
          resizeMode={'contain'}
        />
      );
    }
  };

  // Render the strike and dip symbol inside the compass
  const renderTrendSymbol = () => {
    const trend = compassData.trend;
    let image = require('../../assets/images/compass/trendLine.png');
    if (compassData.magDecTrend >= 0) {
      const spin = trendSpinValue.interpolate({
        inputRange: [0, trend],
        outputRange: ['0deg', trend + 'deg'],
      });

      trendAndPlungeStyles.push({transform: [{rotate: spin}]});
      // First set up animation
      Animated.timing(
        trendSpinValue,
        {
          duration: 100,
          toValue: trend,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        },
      ).start();

      return (
        <Animated.Image
          key={image}
          source={image}
          style={trendAndPlungeStyles}
          resizeMode={'contain'}
        />
      );
    }
  };

  return (
    <View style={compassStyles.compassImageContainer}>
      <Pressable onPress={() => grabMeasurements(true)}>
        <ImageBackground source={require('../../assets/images/compass/compass.png')} style={compassStyles.compassImage}>
          {renderCompassSymbols()}
        </ImageBackground>
      </Pressable>

    </View>
  );
};

export default CompassFace;
