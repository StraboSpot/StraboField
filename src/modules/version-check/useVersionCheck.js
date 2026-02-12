import {Animated, Platform} from 'react-native';

import {checkVersion} from 'react-native-check-version';
import DeviceInfo from 'react-native-device-info';

const useVersionCheck = () => {
  const animateLabel = (animatedPulse) => {
    Animated.sequence([
      // increase size
      Animated.timing(animatedPulse, {
        useNativeDriver: Platform.OS !== 'web',
        toValue: 1,
        duration: 750,
      }),
      // decrease size
      Animated.timing(animatedPulse, {
        useNativeDriver: Platform.OS !== 'web',
        toValue: 0.75,
        duration: 500,
      }),
    ]).start();
  };

  const checkAppStoreVersion = async () => {
    console.log('Got device version:', DeviceInfo.getVersion());
    const version = await checkVersion();
    console.log('Got version info:', version);
    return version;
  };

  return {
    animateLabel,
    checkAppStoreVersion,
  };
};

export default useVersionCheck;
