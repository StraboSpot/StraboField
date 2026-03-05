import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const TagsShortcutModal = ({
                             onPress,
                             zoomToCurrentLocation,
                           }) => {
  /* Render Functions */

  const renderTagsShortcutModal = (closeModal) => {
    return (
      <ModalWrapper
        onCancelPress={closeModal}
        onFooterButtonPress={onPress}
        overlayStyleOverride={{height: '80%'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={true}
      >
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  /* View */

  return renderTagsShortcutModal();
};

export default TagsShortcutModal;
