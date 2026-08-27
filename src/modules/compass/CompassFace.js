import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, ImageBackground, Platform, Pressable, Text, View} from 'react-native';

import {COMPASS_TOGGLE_BUTTONS, DIAL_TICKS} from './compass.constants';
import compassStyles from './compass.styles';

// Animate an azimuth (0-360) to an Animated.Value along the shortest path, so it never
// spins the long way around when crossing 0°/360°. `sign` flips the rotation direction
// (the dial counter-rotates against heading; the measurement symbols rotate with it).
const useAngleSpin = (target, sign = 1, duration = 120) => {
  const anim = useRef(new Animated.Value(0)).current;
  const accumulated = useRef(0);

  useEffect(() => {
    const delta = ((target - (accumulated.current % 360) + 540) % 360) - 180; // [-180, 180)
    accumulated.current += delta;
    Animated.timing(anim, {
      duration,
      easing: Easing.out(Easing.quad),
      toValue: accumulated.current,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [target]);

  return anim.interpolate({inputRange: [0, 360], outputRange: ['0deg', sign * 360 + 'deg']});
};

const CARDINALS = ['N', 'E', 'S', 'W'];

const getCardinal = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((deg % 360) / 45) % 8];
};

const CompassFace = ({compassMeasurementTypes, compassData, grabMeasurements}) => {
  /* Local State */

  // Temporary A/B toggle: the redesigned dial vs. the classic static face used before commit
  // a90dd586. Lets users compare readings while we track down the "readings are not right" reports.
  const [useLegacyCompass, setUseLegacyCompass] = useState(false);

  /* Derived Variables */

  const heading = compassData?.trueHeading ?? compassData?.magHeading ?? 0;
  const strike = compassData?.strike ?? 0;
  const trend = compassData?.trend ?? 0;

  // Dial counter-rotates so N always points at true north; symbols ride the dial's world frame.
  const dialSpin = useAngleSpin(heading, -1);
  const strikeSpin = useAngleSpin(strike, 1);
  const trendSpin = useAngleSpin(trend, 1);

  /* Render Functions */

  const renderTicks = () => {
    return Array.from({length: DIAL_TICKS}, (_, i) => {
      const angle = (360 / DIAL_TICKS) * i;
      const isMajor = angle % 90 === 0;
      return (
        <View key={angle} style={[compassStyles.tickContainer, {transform: [{rotate: angle + 'deg'}]}]}>
          <View style={[compassStyles.tick, isMajor && compassStyles.tickMajor]}/>
        </View>
      );
    });
  };

  const renderCardinals = () => {
    return CARDINALS.map((label, i) => (
      <View key={label} style={[compassStyles.cardinalContainer, {transform: [{rotate: i * 90 + 'deg'}]}]}>
        <Text style={[compassStyles.cardinal, label === 'N' && compassStyles.cardinalNorth]}>{label}</Text>
      </View>
    ));
  };

  const renderCompassSymbols = () => {
    const linearOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR);
    const planarOn = compassMeasurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR);
    const hasTrend = Number.isFinite(compassData?.trend);
    const hasStrike = Number.isFinite(compassData?.strike);

    return (
      <>
        {linearOn && hasTrend && renderTrendSymbol()}
        {planarOn && hasStrike && renderStrikeDipSymbol()}
      </>
    );
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

  // Redesigned dial: the whole face counter-rotates with heading and the symbols ride the dial.
  const renderNewFace = () => (
    <>
      <Text style={compassStyles.headingText}>
        {String(Math.round(heading) % 360).padStart(3, '0')}° {getCardinal(heading)}
      </Text>
      <Pressable onPress={() => grabMeasurements(true)}>
        <View style={compassStyles.dialWrapper}>
          <Animated.View style={[compassStyles.dial, {transform: [{rotate: dialSpin}]}]}>
            {renderTicks()}
            {renderCardinals()}
            {renderCompassSymbols()}
          </Animated.View>
          <View style={compassStyles.indexMarker}/>
        </View>
      </Pressable>
      <Text style={compassStyles.tapHint}>Tap to Measure</Text>
    </>
  );

  // Classic face (pre-a90dd586): static compass image, symbols rotated by their raw azimuth only.
  const renderLegacyFace = () => (
    <Pressable onPress={() => grabMeasurements(true)}>
      <ImageBackground
        source={require('../../assets/images/compass/compass.png')}
        style={compassStyles.compassImage}
      >
        {renderCompassSymbols()}
      </ImageBackground>
    </Pressable>
  );

  /* View */

  return (
    <View style={compassStyles.compassImageContainer}>
      {useLegacyCompass ? renderLegacyFace() : renderNewFace()}
      <Text onPress={() => setUseLegacyCompass(prev => !prev)} style={compassStyles.compassModeToggle}>
        {useLegacyCompass ? 'Switch to new compass' : 'Switch to classic compass'}
      </Text>
    </View>
  );
};

export default CompassFace;
