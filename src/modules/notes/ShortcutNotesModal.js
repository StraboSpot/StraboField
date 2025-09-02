import React from 'react';

import Notes from './Notes';
import ModalWrapper from '../../shared/ui/modal/ModalWrapper';

const ShortcutNotesModal = ({onPress, zoomToCurrentLocation}) => {

  const renderNotesShortcutModal = () => {
    return (
      <ModalWrapper onPress={onPress}>
        <Notes zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  return renderNotesShortcutModal();
};

export default ShortcutNotesModal;
