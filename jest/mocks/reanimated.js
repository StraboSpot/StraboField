// Self-contained inert stand-in for react-native-reanimated. The shipped
// `react-native-reanimated/mock` can't be used under jest v4 because importing it
// runs native worklets/TurboModule initialization, which throws. This covers the
// surface the app and its animated libraries import so modules resolve and the
// initial screen mounts.
const React = require('react');
const {View, Text, Image, ScrollView, FlatList} = require('react-native');

const noop = () => {};
const identity = value => value;

const createAnimatedComponent = Component => Component;

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent,
  default: undefined,
};
Animated.default = Animated;

const useSharedValue = initial => ({value: initial});
const useAnimatedStyle = factory => (typeof factory === 'function' ? factory() : {});
const useDerivedValue = factory => ({value: typeof factory === 'function' ? factory() : undefined});
const useAnimatedRef = () => React.createRef();
const useAnimatedScrollHandler = () => noop;
const useAnimatedGestureHandler = () => noop;
const useAnimatedReaction = noop;

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedProps: () => ({}),
  useEvent: () => noop,
  useHandler: () => ({}),
  withTiming: identity,
  withSpring: identity,
  withDecay: identity,
  withDelay: (_, value) => value,
  withSequence: (...values) => values[values.length - 1],
  withRepeat: identity,
  cancelAnimation: noop,
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  measure: () => ({x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0}),
  scrollTo: noop,
  interpolate: () => 0,
  interpolateColor: () => 'rgba(0, 0, 0, 0)',
  Extrapolation: {CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity'},
  Extrapolate: {CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity'},
  Easing: new Proxy({}, {get: () => () => identity}),
  Layout: {duration: noop, delay: noop, springify: noop},
  FadeIn: {duration: noop, delay: noop},
  FadeOut: {duration: noop, delay: noop},
  createAnimatedComponent,
};
