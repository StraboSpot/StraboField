import React from 'react';

import {useSelector} from 'react-redux';

import {MODAL_KEYS} from '../page/page.constants';
import {TagsNotebookModal} from '../tags';

const FeatureTagsModal = () => {
  const modalVisible = useSelector(state => state.home.modalVisible);

  const isFeatureLevelTaggingOn = modalVisible === MODAL_KEYS.OTHER.FEATURE_TAGS;

  const renderFeatureTagsModal = () => {
    return (
      <TagsNotebookModal isFeatureLevelTagging={isFeatureLevelTaggingOn}/>
    );
  };

  return renderFeatureTagsModal();
};

export default FeatureTagsModal;
