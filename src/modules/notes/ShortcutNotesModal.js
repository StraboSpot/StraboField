import React, {useEffect} from 'react';

import Notes from './Notes';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import useDeviceOrientation from '../home/useDeviceOrientation';

const ShortcutNotesModal = ({onPress, zoomToCurrentLocation}) => {

  const {lockToPortrait, unlockOrientation} = useDeviceOrientation();

  useEffect(() => {
    lockToPortrait();
    return () => unlockOrientation();
  }, []);

  return (
    <ModalWrapper
      onFooterButtonPress={onPress}
      overlayStyleOverride={{maxHeight: '60%', flex: 1}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <Notes zoomToCurrentLocation={zoomToCurrentLocation}/>
    </ModalWrapper>
  );
};

export default ShortcutNotesModal;
