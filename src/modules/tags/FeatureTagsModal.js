import React from 'react';

import {useSelector} from 'react-redux';

import {MODAL_KEYS} from '../page/pageKeys.constants';
import {TagsNotebookModal} from '../tags';

const FeatureTagsModal = () => {
  /* Data Hooks / State */

  const modalVisible = useSelector(state => state.home.modalVisible);

  /* Derived Variables */

  const isFeatureLevelTaggingOn = modalVisible === MODAL_KEYS.OTHER.FEATURE_TAGS;

  /* View */

  return <TagsNotebookModal isFeatureLevelTagging={isFeatureLevelTaggingOn}/>;
};

export default FeatureTagsModal;
