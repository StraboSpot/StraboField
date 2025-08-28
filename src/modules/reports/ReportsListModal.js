import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsList} from '.';
import AddButton from '../../shared/ui/AddButton';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/page.constants';

const ReportsListModal = () => {
  const dispatch = useDispatch();

  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  const addReport = () => {
    dispatch(setModalValues({spots: selectedSpots.map(s=>s.properties.id)}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  return (
    <OverlayWrapper>
      <AddButton
        onPress={addReport}
        title={'Create New Report'}
        type={'outline'}
      />
      <ReportsList isCheckedList/>
    </OverlayWrapper>
  );
};

export default ReportsListModal;
