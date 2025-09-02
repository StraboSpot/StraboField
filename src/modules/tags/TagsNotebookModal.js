import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import ModalWrapper from '../../shared/ui/modal/ModalWrapper';
import {TagsModal} from '../tags';

const TagsNotebookModal = ({
                             closeModal,
                             isFeatureLevelTagging,
                             onPress,
                           }) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const renderTagsModalContent = () => {
    return (
      <ModalWrapper closeModal={closeModal} onPress={onPress}>
        <TagsModal isFeatureLevelTagging={isFeatureLevelTagging}/>
      </ModalWrapper>
    );
  };

  if (!isEmpty(selectedSpot)) return renderTagsModalContent();
  else return null;
};

export default TagsNotebookModal;
