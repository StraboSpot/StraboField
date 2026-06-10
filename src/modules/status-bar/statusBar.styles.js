import {StyleSheet} from 'react-native';

const statusBarStyles = StyleSheet.create({
  backupStatusContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingEnd: 5,
  },
  batteryLevelText: {
    color: 'black',
    fontSize: 10,
    fontWeight: 'bold',
  },
  batteryLevelTextContainer: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    position: 'absolute',
    width: 50,
  },
  batteryStatusContainer: {
    padding: 5,
  },
  connectionStatusContainer: {
    padding: 5,
  },
  statusBarIcon: {
    backgroundColor: 'white',
    borderRadius: 50,
    height: 40,
    width: 40,
  },
});

export default statusBarStyles;
