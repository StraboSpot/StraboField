import React from 'react';

import {useSelector} from 'react-redux';

import TagsModal from './TagsModal';
import {isEmpty} from '../../shared/helpers';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const TagsNotebookModal = ({closeModal, headerTitle, isFeatureLevelTagging}) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const renderTagsModalContent = () => {
    return (
      <ModalWrapper
        closeModal={closeModal}
        headerTitle={headerTitle}
        overlayStyleOverride={{height: '80%'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <TagsModal isFeatureLevelTagging={isFeatureLevelTagging}/>
      </ModalWrapper>
    );
  };

  if (!isEmpty(selectedSpot)) return renderTagsModalContent();
  else return null;
};

export default TagsNotebookModal;
