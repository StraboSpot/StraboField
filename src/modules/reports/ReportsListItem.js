import React, {useState} from 'react';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import {useForm} from '../form';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedProject} from '../project/projects.slice';
import {useTags} from '../tags';

const ReportsListItem = ({
                           doShowTags,
                           isCheckedList,
                           onPress,
                           report,
                         }) => {
  console.log('Rendering ReportsListItem', report.id, '...');

  const dispatch = useDispatch();
  const reports = useSelector(state => state.project.project?.reports) || [];
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  const [selectedReports, setSelectedReports] = useState([]);

  const {getLabel} = useForm();
  const {getTagsAtSpot} = useTags();

  const groupKey = 'general';
  const pageKey = PAGE_KEYS.REPORTS;
  const formName = [groupKey, pageKey];
  const reportTypeLabel = report.report_type ? getLabel(report.report_type, formName) : 'No Type';

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
