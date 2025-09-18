import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/page.constants';
import {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';
import {setSelectedAttributes} from '../spots/spots.slice';
import {TagsNotebookModal} from '../tags';

const FeatureTagsModal = () => {
  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);

  const isFeatureLevelTaggingOn = modalVisible === MODAL_KEYS.OTHER.FEATURE_TAGS;

  const closeFeatureTaggingModal = () => {
    dispatch(setMultipleFeaturesTaggingEnabled(false));
    dispatch(setModalVisible({modal: null}));
    dispatch(setSelectedAttributes([]));
  };

  const renderFeatureTagsModal = () => {
    return (
      <TagsNotebookModal
        closeModal={closeFeatureTaggingModal}
        isFeatureLevelTagging={isFeatureLevelTaggingOn}
      />
    );
  };

  return renderFeatureTagsModal();
};

export default FeatureTagsModal;
