import React from 'react';
import {View} from 'react-native';

import {useDispatch} from 'react-redux';

import ReportsList from './ReportsList';
import AddButton from '../../shared/ui/buttons/AddButton';
import {setActiveModal, setModalValues} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const Reports = () => {
  console.log('Rendering Reports...');

  /* Data Hooks */

  const dispatch = useDispatch();

  /* Logic Helpers */

  const addReport = () => {
    dispatch(setModalValues({}));
    dispatch(setActiveModal({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <AddButton onPress={addReport} title={'Create New Memo'}/>
      <ReportsList/>
    </View>
  );
};

export default Reports;
