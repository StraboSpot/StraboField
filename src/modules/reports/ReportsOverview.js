import React from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getReportsAtSpot, getReportsToList} from './reports.helpers';
import ReportsListItem from './ReportsListItem';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ReportsOverview = ({page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const spot = useSelector(state => state.spot.selectedSpot);
  const {owner_straboUserId} = useSelector(state => state.project.project) || {};
  const {straboUserId} = useSelector(state => state.user);

  /* Derived Variables */

  const reportsToList = getReportsToList(
    getReportsAtSpot(reports, spot.properties.id), straboUserId, owner_straboUserId);

  /* Event Handlers */

  const onReportPressed = (report) => {
    dispatch(setModalValues(report));
    dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.REPORTS}));
  };

  /* View */

  return (
    <FlatList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={
        <ListEmptyText onPress={() => dispatch(setNotebookPageVisible(page.key))} text={'No Memos'}/>
      }
      data={reportsToList}
      keyExtractor={report => report.id}
      renderItem={({item}) => (
        <ReportsListItem
          doShowTags={true}
          onPress={() => onReportPressed(item)}
          report={item}
        />
      )}
    />
  );
};

export default ReportsOverview;
