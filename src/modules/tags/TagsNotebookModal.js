import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';
import {TagsModal} from '../tags';

const TagsNotebookModal = ({
                             closeModal,
                             isFeatureLevelTagging,
                             onPress,
                           }) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const renderTagsModalContent = () => {
    return (
      <OverlayWrapper onPress={onPress} closeModal={closeModal}>
        <TagsModal isFeatureLevelTagging={isFeatureLevelTagging}/>
      </OverlayWrapper>
    );
  };

  if (!isEmpty(selectedSpot)) return renderTagsModalContent();
  else return null;
};

export default TagsNotebookModal;
