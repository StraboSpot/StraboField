import React, {useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {REPORT_FORM_NAME} from './reports.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import useForm from '../form/useForm';
import {updatedProject} from '../project/projects.slice';
import useTags from '../tags/useTags';

const ReportsListItem = ({
                           doShowTags,
                           isCheckedList,
                           isItemChecked,
                           onChecked,
                           onPress,
                           report,
                         }) => {
  console.log('Rendering ReportsListItem', report.id, '...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  const {getLabel} = useForm();
  const {getTagsAtSpot} = useTags();

  /* Local State */

  const [selectedReports, setSelectedReports] = useState([]);

  /* Derived Variables */

  const reportTypeLabel = report.report_type ? getLabel(report.report_type, REPORT_FORM_NAME) : 'No Type';
  // A caller with its own onChecked is picking memos for something and says which are checked. Without one the
  // list is the Add Spots to Memo flow, which checks a memo as it writes the Spots into it and is done with it
  const isChecked = onChecked ? !!isItemChecked : selectedReports.includes(report.id);
  // A picker's box stays put; the Add Spots to Memo list turns it into a chevron once the Spots are written
  const isShowCheckBox = isCheckedList && (!!onChecked || !isChecked);

  /* Event Handlers */

  const handleCheckBoxPressed = () => onChecked ? onChecked(report) : addSpotsToReports();

  // A picker checks and unchecks from the row as well as the box. The Add Spots to Memo list instead opens a memo
  // it has already written the Spots into, and ignores a press on one it has not
  const handlePressed = () => {
    if (onChecked) handleCheckBoxPressed();
    else if (!isCheckedList || isChecked) onPress(report);
  };

  /* Logic Helpers */

  const addSpotsToReports = () => {
    setSelectedReports(prevState => [...prevState, report.id]);
    let reportSpotsIds = report.spots || [];
    reportSpotsIds = [... new Set([...reportSpotsIds, ...selectedSpots.map(s=>s.properties.id)])];
    console.log('Add selected spot ids', reportSpotsIds, 'to report', report);
    const editedReport = JSON.parse(JSON.stringify(report));
    editedReport.modified_timestamp = Date.now();
    editedReport.spots = reportSpotsIds;
    let updatedReports = reports.filter(r => r.id !== editedReport.id);
    updatedReports.push({...editedReport});
    dispatch(updatedProject({field: 'reports', value: updatedReports}));
  };

  /* Render Functions */

  const renderCheckboxes = () => {
    return (
      <ListItem.CheckBox
        checked={isChecked}
        onPress={handleCheckBoxPressed}
      />
    );
  };

  const renderTags = () => {
    const tags = getTagsAtSpot(report.id);
    const tagsString = tags.map(tag => tag.name).sort().join(', ');
    return !isEmpty(tagsString) && <ListItem.Subtitle>{tagsString}</ListItem.Subtitle>;
  };

  /* View */

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      keyExtractor={(item, index) => item?.id || index.toString()}
      onPress={handlePressed}
    >
      <ListItem.Content>
        <ListItem.Title style={[commonStyles.listItemTitle, {fontWeight: 'bold'}]}>{reportTypeLabel}</ListItem.Title>
        <ListItem.Subtitle style={[commonStyles.listItemSubtitle, {color: PRIMARY_TEXT_COLOR}]}>
          {report?.subject || 'No Subject'}
        </ListItem.Subtitle>
        {doShowTags && report && renderTags()}
      </ListItem.Content>
      {isShowCheckBox ? renderCheckboxes() : report && <ListItem.Chevron/>}
    </ListItem>
  );
};

export default ReportsListItem;
