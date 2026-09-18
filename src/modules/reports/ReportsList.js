import React from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getReportsToList} from './reports.helpers';
import ReportsListItem from './ReportsListItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsList = ({checkedItems, isCheckedList, isPreSorted, onChecked, reportsSubset}) => {
  console.log('Rendering ReportsList...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const {straboUserId} = useSelector(state => state.user);

  /* Derived Variables */

  // A caller that put its own order on the memos keeps it - sorting by edit time would reshuffle a list being
  // checked through, since checking a memo edits it
  const reportsToListSorted = isPreSorted ? reportsSubset
    : getReportsToList(reportsSubset ?? reports, straboUserId);

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
            isItemChecked={checkedItems?.some(id => id.toString() === item.id.toString())}
            onChecked={onChecked}
            onPress={() => onShowReport(item)}
            report={item}
          />
        )}
      />
    </View>
  );
};

export default ReportsList;
