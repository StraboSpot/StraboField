import React from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsListItem} from '.';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsList = ({isCheckedList, reportsSubset}) => {
  console.log('Rendering ReportsList...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];

  /* Derived Variables */

  const reportsToList = reportsSubset ? isEmpty(reportsSubset) ? [] : reportsSubset : reports;
  let reportsToListSorted = JSON.parse(JSON.stringify(reportsToList));
  reportsToListSorted.sort((a, b) => {
    return new Date(b.updated_timestamp) - new Date(a.updated_timestamp);
  });

  /* Event Handlers */

  const onShowReport = (report) => {
    dispatch(setModalValues(report));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Memos Found'}/>}
        data={reportsToListSorted}
        keyExtractor={report => report.id}
        renderItem={({item}) => (
          <ReportsListItem
            doShowTags={true}
            isCheckedList={isCheckedList}
            onPress={() => onShowReport(item)}
            report={item}
          />
        )}
      />
    </View>
  );
};

export default ReportsList;
