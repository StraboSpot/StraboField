import React from 'react';

import {TagsModal} from './index';
import ModalWrapper from '../../shared/ui/modal/ModalWrapper';

const AddTagsToSpotsShortcutModal = ({zoomToCurrentLocation}) => {

  const renderAddTagsToSpotsShortcutModal = () => {
    return (
      <ModalWrapper>
        <TagsModal zoomToCurrentLocation={zoomToCurrentLocation}/>
      </ModalWrapper>
    );
  };

  return renderAddTagsToSpotsShortcutModal();
};

export default AddTagsToSpotsShortcutModal;
