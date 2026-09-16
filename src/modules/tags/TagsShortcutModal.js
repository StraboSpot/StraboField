import React from 'react';

import TagsModal from './TagsModal';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const TagsShortcutModal = ({
                             onPress,
                             openSpotInNotebook,
                             zoomToCurrentLocation,
                           }) => {
  /* Render Functions */

  const renderTagsShortcutModal = (closeModal) => {
    return (
      <ModalWrapper
        isChildrenFilled={true}
        onCancelPress={closeModal}
        onFooterButtonPress={onPress}
        overlayStyleOverride={{maxHeight: '80%'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={true}
      >
        <TagsModal openSpotInNotebook={openSpotInNotebook} zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  /* View */

  return renderTagsShortcutModal();
};

export default TagsShortcutModal;
