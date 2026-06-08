import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsList} from '.';
import AddButton from '../../shared/ui/buttons/AddButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsMenu = ({}) => {
  console.log('Rendering ReportsMenu...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);

  /* Logic Helpers */

  const addReport = () => {
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {!isReadOnlyProject && <AddButton onPress={addReport} title={'Create New Memo'}/>}
      <ReportsList/>
    </View>
  );
};

export default ReportsMenu;
