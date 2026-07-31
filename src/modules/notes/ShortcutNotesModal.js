import React, {useRef} from 'react';

import {useSelector} from 'react-redux';

import Notes from './Notes';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const ShortcutNotesModal = ({onPress, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const isLoading = useSelector(state => state.home.loading?.home);

  // const {lockToPortrait, unlockOrientation} = useDeviceOrientation();

  /* Local State */

  // Holds the note-saving action that <Notes> registers, so the sticky footer button can call it.
  const saveRef = useRef(null);

  /* Side Effects */

  // useEffect(() => {
  //   if (SMALL_SCREEN) return;
  //   lockToPortrait();
  //   return () => unlockOrientation();
  // }, []);

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Save'}
      isChildrenFilled
      isLoading={isLoading}
      onActionPressed={() => saveRef.current?.()}
      onFooterButtonPress={onPress}
      overlayStyleOverride={{maxHeight: '60%', flex: 1}}
      showActionButton
      showCancelButton={false}
      showCloseButton
    >
      <Notes registerSave={saveRef} zoomToCurrentLocation={zoomToCurrentLocation}/>
    </ModalWrapper>
  );
};

export default ShortcutNotesModal;
