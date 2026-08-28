import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground, Platform, Pressable, Text, useWindowDimensions, View} from 'react-native';

import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS, DIAL_SIZE, DIAL_TICKS, getEnlargedDialSize} from './compass.constants';
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
  /* Data Hooks */

  // Both toggles live in Redux (set from CompassControls) so the hosting modal can also react — e.g.
  // widen/grow to fit the enlarged face. `isClassicCompass` shows the pre-a90dd586 static face for
  // comparison; `isCompassEnlarged` fills most of the screen so the whole dial is a huge tap target.
  const isClassicCompass = useSelector(state => state.compass.isClassicCompass);
  const isEnlarged = useSelector(state => state.compass.isCompassEnlarged);

  /* Derived Variables */

  const {height, width} = useWindowDimensions();
  // Enlarged fills most of the screen's shorter side; a size override is applied to every
  // size-dependent style so the dial, tick ring, and cardinals all scale together.
  const dialSize = isEnlarged ? getEnlargedDialSize(width, height) : DIAL_SIZE;
  const sizeStyle = {height: dialSize, width: dialSize};

  const heading = compassData?.trueHeading ?? compassData?.magHeading ?? 0;
  const strike = compassData?.strike ?? 0;
  const trend = compassData?.trend ?? 0;

  // Dial counter-rotates so N always points at true north; symbols ride the dial's world frame.
  const dialSpin = useAngleSpin(heading, -1);
  const strikeSpin = useAngleSpin(strike, 1);
  const trendSpin = useAngleSpin(trend, 1);

  // A quick green flash over the face confirms a grab visually, for users with tablet sound off (#911).
  const flashAnim = useRef(new Animated.Value(0)).current;
  const flashOpacity = flashAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.45]});

  /* Event Handlers */

  const handleGrab = () => {
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, {duration: 80, toValue: 1, useNativeDriver: Platform.OS !== 'web'}),
      Animated.timing(flashAnim, {duration: 260, toValue: 0, useNativeDriver: Platform.OS !== 'web'}),
    ]).start();
    grabMeasurements(true);
  };

  /* Render Functions */

  const renderCaptureFlash = extraStyle => (
    <Animated.View
      pointerEvents={'none'}
      style={[compassStyles.captureFlash, sizeStyle, extraStyle, {opacity: flashOpacity}]}
    />
  );

  const renderTicks = () => {
    return Array.from({length: DIAL_TICKS}, (_, i) => {
      const angle = (360 / DIAL_TICKS) * i;
      const isMajor = angle % 90 === 0;
      return (
        <View key={angle} style={[compassStyles.tickContainer, sizeStyle, {transform: [{rotate: angle + 'deg'}]}]}>
          <View style={[compassStyles.tick, isMajor && compassStyles.tickMajor]}/>
        </View>
      );
    });
  };

  const renderCardinals = () => {
    return CARDINALS.map((label, i) => (
      <View key={label} style={[compassStyles.cardinalContainer, sizeStyle, {transform: [{rotate: i * 90 + 'deg'}]}]}>
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
      <Pressable onPress={handleGrab}>
        <View style={[compassStyles.dialWrapper, sizeStyle]}>
          <Animated.View
            style={[compassStyles.dial, sizeStyle, {borderRadius: dialSize / 2, transform: [{rotate: dialSpin}]}]}
          >
            {renderTicks()}
            {renderCardinals()}
            {renderCompassSymbols()}
          </Animated.View>
          {renderCaptureFlash({borderRadius: dialSize / 2})}
          <View style={compassStyles.indexMarker}/>
        </View>
      </Pressable>
      <Text style={compassStyles.tapHint}>Tap to Measure</Text>
    </>
  );

  // Classic face (pre-a90dd586): static compass image, symbols rotated by their raw azimuth only.
  const renderLegacyFace = () => (
    <Pressable onPress={handleGrab}>
      <ImageBackground
        source={require('../../assets/images/compass/compass.png')}
        style={[compassStyles.compassImage, sizeStyle]}
      >
        {renderCompassSymbols()}
        {renderCaptureFlash()}
      </ImageBackground>
    </Pressable>
  );

  /* View */

  return (
    <View style={compassStyles.compassImageContainer}>
      {isClassicCompass ? renderLegacyFace() : renderNewFace()}
    </View>
  );
};

export default CompassFace;
