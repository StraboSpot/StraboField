import React from 'react';

import {TagsModal} from './index';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';

const AddTagsToSpotsShortcutModal = ({zoomToCurrentLocation}) => {

  const renderAddTagsToSpotsShortcutModal = () => {
    return (
      <OverlayWrapper>
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </OverlayWrapper>
    );
  };

  return renderAddTagsToSpotsShortcutModal();
};

export default AddTagsToSpotsShortcutModal;
