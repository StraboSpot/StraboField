import React from 'react';

import {useSelector} from 'react-redux';

import TagsNotebookModal from './TagsNotebookModal';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const FeatureTagsModal = () => {
  /* Data Hooks */

  const activeModal = useSelector(state => state.home.activeModal);

  /* Derived Variables */

  const isFeatureLevelTaggingOn = activeModal === MODAL_KEYS.OTHER.FEATURE_TAGS;

  /* View */

  return <TagsNotebookModal isFeatureLevelTagging={isFeatureLevelTaggingOn}/>;
};

export default FeatureTagsModal;
