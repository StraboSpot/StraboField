import React from 'react';
import {FlatList, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import DatasetPreferencesListItem from './DatasetPreferencesListItem';
import {MEDIUM_TEXT_SIZE, PRIMARY_TEXT_COLOR} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../../shared/ui/SectionDivider';
import {setIsStatusMessagesModalVisible} from '../../home/home.slice';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';

const DatasetPreferencesModal = ({closeModal}) => {
  console.log('Rendering DatasetPreferencesModal...');
  const dispatch = useDispatch();

  const datasets = useSelector(state => state.project.datasets) || {};

  const handleActionButtonPressed = () => {
    dispatch(setIsStatusMessagesModalVisible(false));
    dispatch(setSidePanelVisible({bool: false}));
    closeModal();
  };

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Dataset Preferences'}
      isVisible={true}
      onActionPressed={handleActionButtonPressed}
      showCancelButton={false}
    >
      <View style={{flex: 1}}>
        <View style={{paddingHorizontal: 10, paddingBottom: 10, alignItems: 'center'}}>
          <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: MEDIUM_TEXT_SIZE}}>
            *All settings may be modified later on the Datasets page.
          </Text>
        </View>
        <SectionDivider dividerText={'Datasets'}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          data={Object.values(datasets)}
          keyExtractor={item => item.id}
          renderItem={({item}) => <DatasetPreferencesListItem dataset={item}/>}
        />
      </View>
    </ModalWrapper>
  );
};

export default DatasetPreferencesModal;
