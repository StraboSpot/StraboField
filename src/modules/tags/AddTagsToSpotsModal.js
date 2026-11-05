import React from 'react';

import TagsChecklist from './TagsChecklist';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const AddTagsToSpotsModal = ({zoomToCurrentLocation}) => {
  /* Render Functions */

  const renderAddTagsToSpotsModal = () => {
    return (
      <ModalWrapper
        isChildrenFilled={true}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={true}
      >
        <TagsChecklist zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  /* View */

  return renderAddTagsToSpotsModal();
};

export default AddTagsToSpotsModal;
