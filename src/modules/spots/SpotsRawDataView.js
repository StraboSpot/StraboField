import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import JsonTreeModal from '../../shared/ui/modals/JsonTreeModal';
import {setModalVisible} from '../home/home.slice';

const SpotsRawDataView = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  /* Derived Variables */

  const dataJson = {Project: project, Spots: selectedSpots};

  /* Logic Helpers */

  const closeModal = () => {
    dispatch(setModalVisible({modal: null}));
  };

  /* View */

  return <JsonTreeModal closeModal={closeModal} data={dataJson}/>;
};

export default SpotsRawDataView;
