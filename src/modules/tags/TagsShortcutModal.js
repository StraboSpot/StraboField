import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modal/ModalWrapper';

const TagsShortcutModal = ({
                             onPress,
                             zoomToCurrentLocation,
                           }) => {

  const renderTagsShortcutModal = () => {
    return (
      <ModalWrapper onPress={onPress}>
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  return renderTagsShortcutModal();
};

export default TagsShortcutModal;
