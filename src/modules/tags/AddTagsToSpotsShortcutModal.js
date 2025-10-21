import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const AddTagsToSpotsShortcutModal = ({zoomToCurrentLocation}) => {

  const renderAddTagsToSpotsShortcutModal = () => {
    return (
      <ModalWrapper
        overlayStyleOverride={{height: '80%'}}
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
