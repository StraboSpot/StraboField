import React, {useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {REPORT_FORM_NAME} from './reports.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import {useForm} from '../form';
import {updatedProject} from '../project/projects.slice';
import {useTags} from '../tags';

const ReportsListItem = ({
                           doShowTags,
                           isCheckedList,
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

  /* Logic Helpers */

  const addSpotsToReports = () => {
    setSelectedReports(prevState => [...prevState, report.id]);
    let reportSpotsIds = report.spots || [];
    reportSpotsIds = [... new Set([...reportSpotsIds, ...selectedSpots.map(s=>s.properties.id)])];
    console.log('Add selected spot ids', reportSpotsIds, 'to report', report);
    const editedReport = JSON.parse(JSON.stringify(report));
    editedReport.updated_timestamp = Date.now();
    editedReport.spots = reportSpotsIds;
    let updatedReports = reports.filter(r => r.id !== editedReport.id);
    updatedReports.push({...editedReport});
    dispatch(updatedProject({field: 'reports', value: updatedReports}));
  };

  /* Render Functions */

  const renderCheckboxes = () => {
    return (
      <ListItem.CheckBox
        checked={selectedReports.includes(report.id)}
        onPress={addSpotsToReports}
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
      onPress={() => (!isCheckedList || (isCheckedList && selectedReports.includes(report.id))) && onPress(report)}
    >
      <ListItem.Content>
        <ListItem.Title style={[commonStyles.listItemTitle, {fontWeight: 'bold'}]}>{reportTypeLabel}</ListItem.Title>
        <ListItem.Subtitle style={[commonStyles.listItemSubtitle, {color: PRIMARY_TEXT_COLOR}]}>
          {report?.subject || 'No Subject'}
        </ListItem.Subtitle>
        {doShowTags && report && renderTags()}
      </ListItem.Content>
      {isCheckedList && !selectedReports.includes(report.id) ? renderCheckboxes() : report && <ListItem.Chevron/>}
    </ListItem>
  );
};

export default ReportsListItem;
