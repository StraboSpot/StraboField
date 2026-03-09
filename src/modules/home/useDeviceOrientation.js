import RNOrientationDirector, {Orientation} from 'react-native-orientation-director';
import {useToast} from 'react-native-toast-notifications';

import {useWindowSize} from '../../shared/ui/useWindowSize';

const toastOptions = {duration: 1000, placement: 'top'};

const useDeviceOrientation = () => {
  /* Data Hooks */

  const toast = useToast();
  const {width, height} = useWindowSize();

  /* Exported Functions */

  const lockOrientation = () => {
    const orientation = width > height ? Orientation.landscape : Orientation.portrait;
    RNOrientationDirector.lockTo(orientation);
    toast.show(
      `Screen orientation LOCKED to  ${RNOrientationDirector.convertOrientationToHumanReadableString(orientation)}`,
      {...toastOptions, type: 'lock'});
  };

  const lockToPortrait = () => {
    RNOrientationDirector.lockTo(Orientation.portrait);
  };

  const unlockOrientation = () => {
    RNOrientationDirector.unlock();
    toast.show('Screen orientation UNLOCKED', {...toastOptions, type: 'unlock'});
  };

  return {
    lockOrientation,
    lockToPortrait,
    unlockOrientation,
  };
};

export default useDeviceOrientation;
