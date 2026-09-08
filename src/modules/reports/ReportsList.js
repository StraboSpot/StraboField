import React from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {ReportsListItem} from '.';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsList = ({isCheckedList, reportsSubset}) => {
  console.log('Rendering ReportsList...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const {straboUserId} = useSelector(state => state.user);

  /* Derived Variables */

  // A memo marked only_me is its author's alone. One saved before authorship was recorded names no author,
  // so there is nobody to keep it from and it stays listed
  const reportsToList = (reportsSubset ?? reports).filter(
    r => r.report_privacy !== 'only_me' || !r.straboUserId || r.straboUserId === straboUserId);
  const reportsToListSorted = [...reportsToList].sort(
    (a, b) => new Date(b.updated_timestamp) - new Date(a.updated_timestamp));

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
