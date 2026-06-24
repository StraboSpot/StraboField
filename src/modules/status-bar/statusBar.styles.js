import {StyleSheet} from 'react-native';

const statusBarStyles = StyleSheet.create({
  backupStatusContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    gap: 4,
    paddingEnd: 5,
  },
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
    marginTop: -6,
  },
  batteryStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionStatusContainer: {
    padding: 5,
  },
  saveAlertIconContainer: {
    alignItems: 'center',
    borderRadius: 50,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});

export default statusBarStyles;
