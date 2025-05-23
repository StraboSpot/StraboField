import React from 'react';
import {FlatList, View} from 'react-native';

import {Button, ListItem} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {setModalValues, setModalVisible} from '../../home/home.slice';
import {MODAL_KEYS} from '../../page/page.constants';

const DailyNotesSection = () => {
  const dispatch = useDispatch();

  const dailyNotes = useSelector(state => state.project.project?.description?.daily_setup) || [];

  const addDailyNote = () => {
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.DAILY_NOTES}));
  };

  const editDailyNote = (item) => {
    dispatch(setModalValues(item));
    dispatch(setModalVisible({modal: MODAL_KEYS.OTHER.DAILY_NOTES}));
  };

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

  return (
    <View>
      <SectionDivider dividerText={'Daily Notes'}/>
      <Button
        title={'Add New Daily Note'}
        titleStyle={commonStyles.standardButtonText}
        type={'clear'}
        onPress={addDailyNote}
      />
      <View style={{flex: 1}}>
        <FlatList
          data={dailyNotes.slice().sort((a, b) => new Date(b.date) - new Date(a.date))}
          keyExtractor={item => item.date}
          renderItem={({item}) => renderDailyNotesListItem(item)}
          ListEmptyComponent={<ListEmptyText text={'No Daily Notes'}/>}
        />
      </View>
    </View>
  );
};

export default DailyNotesSection;
