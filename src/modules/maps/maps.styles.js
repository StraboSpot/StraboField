import {StyleSheet} from 'react-native';

const circleRadius = 20;

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: -1,
  },
  map: {
    flex: 1,
  },
  // --- MapPoint Style ---
  vertexEditPoint: {
    borderColor: 'white',
    borderRadius: circleRadius,
    borderWidth: 2,
    height: circleRadius,
    position: 'absolute',
    width: circleRadius,
  },
});

export default mapStyles;
