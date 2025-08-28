import React from 'react';

import {TagsModal} from './index';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';

const TagsShortcutModal = ({
                             onPress,
                             zoomToCurrentLocation,
                           }) => {

  const renderTagsShortcutModal = () => {
    return (
      <OverlayWrapper onPress={onPress}>
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </OverlayWrapper>
    );
  };

  return renderTagsShortcutModal();
};

export default TagsShortcutModal;
