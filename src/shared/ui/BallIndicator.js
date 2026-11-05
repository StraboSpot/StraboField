import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

const BALL_COUNT = 8;
const CYCLE_DURATION = 1200;

// One step per ball plus the return to the start, so the loop joins up without a jump
const INPUT_RANGE = Array.from({length: BALL_COUNT + 1}, (_, step) => step / BALL_COUNT);

// A ball's scale at each step: largest when the wave reaches it, then shrinking until it comes round again
const getBallScales = index => INPUT_RANGE.map((_, step) => {
  const stepsSinceLargest = (step - 1 - index + BALL_COUNT) % BALL_COUNT;
  return 1.2 - 0.5 * stepsSinceLargest / (BALL_COUNT - 1);
});

// A ring of balls with a wave of size running around it
const BallIndicator = ({color, size, style}) => {
  /* Local State */

  const progress = useRef(new Animated.Value(0)).current;

  /* Side Effects */

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(progress, {
      duration: CYCLE_DURATION,
      easing: Easing.linear,
      toValue: 1,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, []);

  /* View */

  return (
    <View style={[styles.container, style]}>
      <View style={{height: size, width: size}}>
        {Array.from({length: BALL_COUNT}, (_, index) => (
          <View key={index} style={[styles.layer, {transform: [{rotate: index * 360 / BALL_COUNT + 'deg'}]}]}>
            <Animated.View
              style={{
                backgroundColor: color,
                borderRadius: size / 10,
                height: size / 5,
                margin: size / 20,
                transform: [{scale: progress.interpolate({inputRange: INPUT_RANGE, outputRange: getBallScales(index)})}],
                width: size / 5,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});

export default BallIndicator;
