import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useSelector} from 'react-redux';

import DailyNotesModal from './DailyNotesModal';
import commonStyles from '../../shared/common.styles';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';

const DailyNotes = () => {
  /* Data Hooks */

  const dailyNotes = useSelector(state => state.project.project?.description?.daily_setup) || [];

  /* Local State */

  // null while the modal is closed
  const [dailyNoteToEdit, setDailyNoteToEdit] = useState(null);

  /* Render Functions */

  const renderDailyNotesListItem = (item) => {
    const title = moment(item.date).format('MM/DD/YYYY, h:mm:ss a');
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        onPress={() => setDailyNoteToEdit(item)}
      >
        <ListItem.Content style={{overflow: 'hidden'}}>
          <ListItem.Title style={commonStyles.listItemTitle}>{title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  /* View */

  return (
    <View style={{flex: 1, flexDirection: 'column'}}>
      <SectionDividerWithRightButton
        dividerText={'Daily Notes'}
        onPress={() => setDailyNoteToEdit({})}
      />
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No Daily Notes Found'}/>}
        data={dailyNotes.slice().sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={item => item.date}
        renderItem={({item}) => renderDailyNotesListItem(item)}
      />
      {dailyNoteToEdit && (
        <DailyNotesModal
          closeModal={() => setDailyNoteToEdit(null)}
          dailyNote={dailyNoteToEdit}
        />
      )}
    </View>
  );
};

export default DailyNotes;
