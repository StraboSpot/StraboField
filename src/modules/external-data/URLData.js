import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import externalDataStyles from './externalData.styles';
import useExternalData from './useExternalData';
import useDevice from '../../services/useDevice';
import commonStyles from '../../shared/common.styles';
import {truncateText, urlValidator} from '../../shared/Helpers';
import {BLUE} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import TextInputModal from '../../shared/ui/TextInputModal';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';

const UrlData = ({
                   editable,
                   initializeDelete,
                   spot,
                 }) => {
  const dispatch = useDispatch();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [urlToEdit, setUrlToEdit] = useState({});

  const {openURL} = useDevice();
  const {saveEdits} = useExternalData();

  const editUrl = (inURLToEdit, i) => {
    if (editable) {
      setUrlToEdit({index: i, url: inURLToEdit});
      setIsEditModalVisible(true);
    }
    else dispatch(setNotebookPageVisible(PAGE_KEYS.DATA));
  };

  const renderURLEditModal = () => {
    return (
      <TextInputModal
        multiline={true}
        keyboardType={'url'}
        dialogTitle={'Edit Url'}
        visible={isEditModalVisible}
        onPress={onSaveEdits}
        closeModal={() => setIsEditModalVisible(false)}
        value={urlToEdit.url}
        onChangeText={text => setUrlToEdit({...urlToEdit, url: text})}
      />
    );
  };

  const renderUrlListItem = (urlItem, i) => {
    return (
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <ListItem.Title
            style={[commonStyles.listItemTitle, {color: BLUE}]}
            onPress={() => openURL(urlItem)}>
            {truncateText(urlItem, 33)}
          </ListItem.Title>

          <View style={{flexDirection: 'row'}}>
            <Button
              buttonStyle={externalDataStyles.iconButton}
              type={'clear'}
              onPress={() => editUrl(urlItem, i)}
              icon={
                <Icon
                  name={'edit'}
                  type={'material'}
                  size={20}
                  color={'darkgrey'}
                  containerStyle={externalDataStyles.iconContainer}
                />
              }
            />
            {editable && (
              <Button
                buttonStyle={externalDataStyles.iconButton}
                type={'clear'}
                onPress={() => initializeDelete('url', urlItem)}
                icon={
                  <Icon
                    name={'trash'}
                    type={'font-awesome'}
                    size={25}
                    color={'darkgrey'}
                    containerStyle={externalDataStyles.iconContainer}
                  />
                }
              />
            )}
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  const onSaveEdits = () => {
    try {
      setIsEditModalVisible(false);
      if (urlValidator(urlToEdit.url)) saveEdits(urlToEdit);
      else throw Error('Not valid URL.');
    }
    catch (err) {
      console.error('Error saving edits', err);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Please make sure you enter a valid url. ' + err));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  return (
    <View style={{flex: 1}}>
      <FlatList
        listKey={'urls'}
        keyExtractor={index => index}
        data={spot.properties?.data?.urls}
        renderItem={({item, index}) => renderUrlListItem(item, index)}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={'No URLs saved'}/>}
      />
      {renderURLEditModal()}
    </View>
  );
};

export default UrlData;
