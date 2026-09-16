import React from 'react';

import {useSelector} from 'react-redux';

import TagsNotebookModal from './TagsNotebookModal';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const FeatureTagsModal = () => {
  /* Data Hooks */

  const modalVisible = useSelector(state => state.home.modalVisible);

  /* Derived Variables */

  const isFeatureLevelTaggingOn = modalVisible === MODAL_KEYS.OTHER.FEATURE_TAGS;

  /* View */

  return <TagsNotebookModal isFeatureLevelTagging={isFeatureLevelTaggingOn}/>;
};

export default FeatureTagsModal;
