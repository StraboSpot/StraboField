import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsList} from '.';
import commonStyles from '../../shared/common.styles';
import AddButton from '../../shared/ui/buttons/AddButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import PageHeader from '../page/PageHeader';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsPage = () => {
  console.log('Rendering ReportsPage...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  const reportsUsingThisSpot = reports.reduce((acc, report) => {
    const doesThisReportUseThisSpot = report?.spots?.find(id => id === spot.properties.id);
    return doesThisReportUseThisSpot ? [...acc, report] : acc;
  }, []);

  /* Logic Helpers */

  const addReport = () => {
    dispatch(setModalValues({spots: [spot.properties.id]}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'Reports'}/>
      <AddButton onPress={addReport} title={'Create New Report with this Spot'}/>
      <Text style={[commonStyles.listItemTitle, commonStyles.textBold, {paddingLeft: 10}]}>
        Reports referencing this Spot:
      </Text>
      <ReportsList reportsSubset={reportsUsingThisSpot}/>
    </View>
  );
};

export default ReportsPage;
