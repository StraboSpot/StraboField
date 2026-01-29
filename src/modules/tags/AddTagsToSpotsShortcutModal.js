import React from 'react';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {TagsModal} from './index';

const AddTagsToSpotsShortcutModal = ({zoomToCurrentLocation}) => {

  const renderAddTagsToSpotsShortcutModal = () => {
    return (
      <ModalWrapper
        overlayStyleOverride={{maxHeight: 600, flex: 1}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={true}
      >
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  return renderAddTagsToSpotsShortcutModal();
};

export default AddTagsToSpotsShortcutModal;
