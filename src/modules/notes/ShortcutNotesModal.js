import React from 'react';

import Notes from './Notes';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';

const ShortcutNotesModal = ({onPress, zoomToCurrentLocation}) => {

  const renderNotesShortcutModal = () => {
    return (
      <OverlayWrapper onPress={onPress}>
        <Notes zoomToCurrentLocation={zoomToCurrentLocation}/>
      </OverlayWrapper>
    );
  };

  return renderNotesShortcutModal();
};

export default ShortcutNotesModal;
