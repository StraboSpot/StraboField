import RNOrientationDirector, {Orientation} from 'react-native-orientation-director';
import {useToast} from 'react-native-toast-notifications';

import {useWindowSize} from '../../shared/ui/useWindowSize';

const useDeviceOrientation = () => {
  const toast = useToast();
  const {width, height} = useWindowSize();

  const lockToPortrait = () => {
    RNOrientationDirector.lockTo(Orientation.portrait);
  };

  const lockOrientation = () => {
    const orientation = width > height ? Orientation.landscape : Orientation.portrait;
    RNOrientationDirector.lockTo(orientation);
    toast.show(
      `Screen orientation LOCKED to  ${RNOrientationDirector.convertOrientationToHumanReadableString(orientation)}`);
  };

  const unlockOrientation = () => {
    RNOrientationDirector.unlock();
    toast.show('Screen orientation UNLOCKED');
  };

  return {
    lockToPortrait: lockToPortrait,
    lockOrientation: lockOrientation,
    unlockOrientation: unlockOrientation,
  };
};

export default useDeviceOrientation;
