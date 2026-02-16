import React from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MODAL_KEYS} from '../page/page.constants';

const DailyNotes = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const dailyNotes = useSelector(state => state.project.project?.description?.daily_setup) || [];

  /* Logic Helpers */

  const addDailyNote = () => {
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.DAILY_NOTES}));
  };

  const editDailyNote = (item) => {
    dispatch(setModalValues(item));
    dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.DAILY_NOTES}));
  };

  /* Render Functions */

  const renderDailyNotesListItem = (item) => {
    const title = moment(item.date).format('MM/DD/YYYY, h:mm:ss a');
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        onPress={() => editDailyNote(item)}
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
        onPress={addDailyNote}
      />
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText text={'No Daily Notes added yet. Add a Daily Note by using the + button above.'}/>
        }
        data={dailyNotes.slice().sort((a, b) => new Date(b.date) - new Date(a.date))}
        keyExtractor={item => item.date}
        renderItem={({item}) => renderDailyNotesListItem(item)}
      />
    </View>
  );
};

export default DailyNotes;
