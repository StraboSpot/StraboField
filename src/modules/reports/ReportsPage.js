import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsList} from '.';
import commonStyles from '../../shared/common.styles';
import AddButton from '../../shared/ui/buttons/AddButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/page.constants';
import ReturnToOverviewButton from '../page/ui/ReturnToOverviewButton';

const ReportsPage = ({}) => {
  console.log('Rendering ReportsPage...');

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const spot = useSelector(state => state.spot.selectedSpot);

  const reportsUsingThisSpot = reports.reduce((acc, report) => {
    const doesThisReportUseThisSpot = report?.spots?.find(id => id === spot.properties.id);
    return doesThisReportUseThisSpot ? [...acc, report] : acc;
  }, []);

  const addReport = () => {
    dispatch(setModalValues({spots: [spot.properties.id]}));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  return (
    <View style={{flex: 1}}>
      <ReturnToOverviewButton/>
      <AddButton
        onPress={addReport}
        title={'Create New Report with this Spot'}
        type={'outline'}
      />
      <Text style={[commonStyles.listItemTitle, commonStyles.textBold, {paddingLeft: 10}]}>
        Reports referencing this Spot:
      </Text>
      <ReportsList reportsSubset={reportsUsingThisSpot}/>
    </View>
  );
};

export default ReportsPage;
