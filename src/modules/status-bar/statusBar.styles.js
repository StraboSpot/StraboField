import {StyleSheet} from 'react-native';

const statusBarStyles = StyleSheet.create({
  batteryLevelText: {
    color: 'black',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  batteryLevelTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: -3,
  },
  batteryStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionStatusContainer: {
    padding: 5,
  },
});

export default statusBarStyles;
