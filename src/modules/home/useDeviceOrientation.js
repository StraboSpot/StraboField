import RNFS from 'react-native-fs';
import RNOrientationDirector, {Orientation} from 'react-native-orientation-director';
import {useToast} from 'react-native-toast-notifications';

import {useWindowSize} from '../../shared/ui/useWindowSize';

const toastOptions = {duration: 1000, placement: 'top'};

// TEMP debug logging for issue #959 (MORE page orientation lock). Remove when resolved.
// Read on host with: xcrun simctl get_app_container booted org.StraboSpot2 data → <container>/Documents/orientation-debug.log
const ORIENTATION_LOG = RNFS.DocumentDirectoryPath + '/orientation-debug.log';
const humanize = o => RNOrientationDirector.convertOrientationToHumanReadableString(o);
const logOrientation = async (action, extra = {}) => {
  try {
    const [device, iface, locked] = await Promise.all([
      RNOrientationDirector.getDeviceOrientation(),
      RNOrientationDirector.getInterfaceOrientation(),
      RNOrientationDirector.isLocked(),
    ]);
    const line = `${new Date().toISOString()} ${action} ${JSON.stringify({
      ...extra,
      device: device != null ? humanize(device) : device,
      interface: iface != null ? humanize(iface) : iface,
      isLockedBefore: locked,
    })}\n`;
    await RNFS.appendFile(ORIENTATION_LOG, line, 'utf8');
  }
  catch (err) {
    console.warn('orientation log failed', err);
  }
};

const useDeviceOrientation = () => {
  /* Data Hooks */

  const toast = useToast();
  const {width, height} = useWindowSize();

  /* Exported Functions */

  const lockOrientation = () => {
    const orientation = width > height ? Orientation.landscape : Orientation.portrait;
    logOrientation('lockOrientation', {width, height, lockTo: humanize(orientation)});
    RNOrientationDirector.lockTo(orientation);
    toast.show(
      `Screen orientation LOCKED to  ${RNOrientationDirector.convertOrientationToHumanReadableString(orientation)}`,
      {...toastOptions, type: 'lock'});
  };

  const lockToPortrait = () => {
    logOrientation('lockToPortrait', {width, height, lockTo: humanize(Orientation.portrait)});
    RNOrientationDirector.lockTo(Orientation.portrait);
  };

  const unlockOrientation = () => {
    logOrientation('unlockOrientation', {width, height});
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
