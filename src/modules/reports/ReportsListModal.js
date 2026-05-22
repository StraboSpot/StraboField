import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsList} from '.';
import AddButton from '../../shared/ui/buttons/AddButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsListModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  /* Logic Helpers */

  const addReport = () => {
    dispatch(setModalValues({spots: selectedSpots.map(s => s.properties.id)}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <ModalWrapper>
      {!isReadOnlyProject && <AddButton onPress={addReport} title={'Create New Report'}/>}
      <ReportsList isCheckedList/>
    </ModalWrapper>
  );
};

export default ReportsListModal;
