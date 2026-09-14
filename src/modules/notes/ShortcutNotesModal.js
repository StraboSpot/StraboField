import React, {useRef, useState} from 'react';

import Notes from './Notes';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const ShortcutNotesModal = ({onPress, openSpotInNotebook, zoomToCurrentLocation}) => {
  /* Data Hooks */

  // const {lockToPortrait, unlockOrientation} = useDeviceOrientation();

  /* Local State */

  const [isSaving, setIsSaving] = useState(false);

  // Holds the note-saving action that <Notes> registers, so the sticky footer button can call it.
  const saveRef = useRef(null);

  /* Side Effects */

  // useEffect(() => {
  //   if (SMALL_SCREEN) return;
  //   lockToPortrait();
  //   return () => unlockOrientation();
  // }, []);

  /* Event Handlers */

  // Track this modal's own save. The app-wide home loading flag this used to read is written by dozens of
  // unrelated screens, so it hid the close button for reasons that had nothing to do with saving a note.
  const handleActionPressed = async () => {
    try {
      setIsSaving(true);
      await saveRef.current?.();
    }
    finally {
      setIsSaving(false);
    }
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Save'}
      isChildrenFilled
      isLoading={isSaving}
      onActionPressed={handleActionPressed}
      onFooterButtonPress={onPress}
      overlayStyleOverride={{maxHeight: '60%', flex: 1}}
      showActionButton
      showCancelButton={false}
      showCloseButton
    >
      <Notes
        openSpotInNotebook={openSpotInNotebook}
        registerSave={saveRef}
        zoomToCurrentLocation={zoomToCurrentLocation}
      />
      <Loading isLoading={isSaving}/>
    </ModalWrapper>
  );
};

export default ShortcutNotesModal;
