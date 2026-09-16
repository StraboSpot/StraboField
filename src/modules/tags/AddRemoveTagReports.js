import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import useTags from './useTags';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../main-menu-panel/side-panel/SidePanelHeader';
import {getVisibleReports} from '../reports/reports.helpers';
import ReportsList from '../reports/ReportsList';

const AddRemoveTagReports = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const selectedTag = useSelector(state => state.project.selectedTag);
  const straboUserId = useSelector(state => state.user?.straboUserId);

  const {addRemoveReportFromTag, getReportsWithThisTag} = useTags();

  /* Derived Variables */

  // A memo holds its own tag ids, so which memos are checked is read back off the memos
  const checkedReportsIds = getReportsWithThisTag(selectedTag).map(report => report.id);
  // By subject rather than by edit time, which is what the Memos list goes by: checking a memo here edits it, so
  // that order would send each one to the top of the list as it was checked
  const reportsToPick = getVisibleReports(reports, straboUserId).sort(
    (a, b) => (a.subject || '').localeCompare(b.subject || ''));

  /* Event Handlers */

  const handleReportChecked = report => addRemoveReportFromTag(report, selectedTag);

  /* View */

  return (
    <View style={{flex: 1}}>
      <SidePanelHeader
        backButton={() => dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}))}
        headerTitle={!isEmpty(selectedTag) && `Add/Remove ${selectedTag.name}`}
        title={`${selectedTag.name}`}
      />
      <View style={{...commonStyles.buttonContainer, flex: 1}}>
        <ReportsList
          checkedItems={checkedReportsIds}
          isCheckedList
          isPreSorted
          onChecked={handleReportChecked}
          reportsSubset={reportsToPick}
        />
      </View>
    </View>
  );
};

export default AddRemoveTagReports;
