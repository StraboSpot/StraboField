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

  // Freezes the UI to whatever orientation it is in right now (the specific one, so which landscape is
  // preserved too). Used when the compass opens so moving/tilting the tablet to sight a measurement can't
  // flip the screen. Falls back to aspect ratio if the current orientation isn't lockable (e.g. face up).
  const lockToCurrentOrientation = async () => {
    const current = await RNOrientationDirector.getInterfaceOrientation();
    const target = RNOrientationDirector.isLockableOrientation(current)
      ? current
      : (width > height ? Orientation.landscape : Orientation.portrait);
    RNOrientationDirector.lockTo(target);
    toast.show(
      `Screen orientation LOCKED to ${RNOrientationDirector.convertOrientationToHumanReadableString(target)}`,
      {...toastOptions, type: 'lock'});
  };

  const lockToPortrait = () => {
    RNOrientationDirector.lockTo(Orientation.portrait);
  };

  const unlockOrientation = () => {
    if (!RNOrientationDirector.isLocked()) return;
    RNOrientationDirector.unlock();
    toast.show('Screen orientation UNLOCKED', {...toastOptions, type: 'unlock'});
  };

  return {
    lockOrientation,
    lockToCurrentOrientation,
    lockToPortrait,
    unlockOrientation,
  };
};

export default useDeviceOrientation;
