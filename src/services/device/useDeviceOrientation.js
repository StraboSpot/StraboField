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

  // Holds the UI in portrait while the compass is open, on every device, so the edge the compass measures a
  // lineation along (the device's top edge) is always the edge at the top of the screen, and the screen can't
  // rotate while sighting a reading. Quiet, since it happens on every compass open. Returns a function that puts
  // back whatever was there before: unlocked, or the lock that was already set (the small-screen portrait lock,
  // or the user's own lock from the map, possibly landscape). There's no getter for the locked orientation, but
  // while locked the interface orientation is the locked one, so that's read before overriding it.
  const lockToPortraitWhileOpen = async () => {
    const previousLock = RNOrientationDirector.isLocked() ? await RNOrientationDirector.getInterfaceOrientation()
      : null;
    RNOrientationDirector.lockTo(Orientation.portrait);
    return () => (previousLock ? RNOrientationDirector.lockTo(previousLock) : RNOrientationDirector.unlock());
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
    lockToPortrait,
    lockToPortraitWhileOpen,
    unlockOrientation,
  };
};

export default useDeviceOrientation;
