import React from 'react';

import {useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {TagsModal} from '../tags';

const TagsNotebookModal = ({isFeatureLevelTagging}) => {
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const handleDonePress = () => {
    console.log('Done button pressed');
  };

  const renderTagsModalContent = () => {
    return (
      <ModalWrapper
        onActionPressed={handleDonePress}
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
