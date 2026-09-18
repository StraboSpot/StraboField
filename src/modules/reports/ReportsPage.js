import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getReportsAtSpot} from './reports.helpers';
import ReportsList from './ReportsList';
import commonStyles from '../../shared/common.styles';
import AddButton from '../../shared/ui/buttons/AddButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import PageHeader from '../page/PageHeader';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsPage = ({page}) => {
  console.log('Rendering ReportsPage...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const reports = useSelector(state => state.project.project?.reports) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const reportsUsingThisSpot = getReportsAtSpot(reports, spot.properties.id);
  // This page serves a sample too, so it names whichever is being read
  const spotLabel = spot.properties?.isSample ? 'Sample' : 'Spot';

  /* Logic Helpers */

  const addReport = () => {
    dispatch(setModalValues({spots: [spot.properties.id]}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={page.label}/>
      {!isReadOnlyProject && <AddButton onPress={addReport} title={'Create New Memo with this ' + spotLabel}/>}
      <Text style={[commonStyles.listItemTitle, commonStyles.textBold, {paddingLeft: 10}]}>
        Memos referencing this {spotLabel}:
      </Text>
      <ReportsList reportsSubset={reportsUsingThisSpot}/>
    </View>
  );
};

export default ReportsPage;
