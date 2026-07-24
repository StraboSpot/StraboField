import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const AddTagsToSpotsShortcutModal = ({zoomToCurrentLocation}) => {
  /* Render Functions */

  const renderAddTagsToSpotsShortcutModal = () => {
    return (
      <ModalWrapper
        isChildrenFilled={true}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={true}
      >
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  /* View */

  return renderAddTagsToSpotsShortcutModal();
};

export default AddTagsToSpotsShortcutModal;
