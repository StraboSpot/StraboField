import React from 'react';

import {useSelector} from 'react-redux';

import TagsChecklist from './TagsChecklist';
import {isEmpty} from '../../shared/helpers';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const AddTagsModal = ({closeModal, headerTitle, isFeatureLevelTagging}) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const renderAddTagsModal = () => {
    return (
      <ModalWrapper
        closeModal={closeModal}
        headerTitle={headerTitle}
        overlayStyleOverride={{height: '80%'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <TagsChecklist isFeatureLevelTagging={isFeatureLevelTagging}/>
      </ModalWrapper>
    );
  };

  if (!isEmpty(selectedSpot)) return renderAddTagsModal();
  else return null;
};

export default AddTagsModal;
