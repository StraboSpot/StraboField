import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const TagsShortcutModal = ({
                             onPress,
                             zoomToCurrentLocation,
                           }) => {

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
        {/*<Text>HELLO I AM A TAG</Text>*/}
      </ModalWrapper>
    );
  };

  return renderTagsShortcutModal();
};

export default TagsShortcutModal;
