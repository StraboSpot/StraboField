import React, {useState} from 'react';
import {FlatList, Text} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import {WarningModal} from '../../../shared/ui/modals';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {setLoadingStatus} from '../../home/home.slice';
import useStratSection from '../../maps/strat-section/useStratSection';
import {PAGE_KEYS} from '../../page/page.constants';
import {useSpots} from '../../spots';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookMenu = ({closeNotebookMenu, isNotebookMenuVisible, isReadOnly, zoomToSpots}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isDeleteSpotModalVisible, setIsDeleteSpotModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {checkIsSafeDelete, copySpot, deleteSpot, isStratInterval} = useSpots();
  const navigation = useNavigation();
  const {deleteInterval} = useStratSection();

  const actions = [
    {key: 'copy', title: 'Copy this Spot'},
    {key: 'zoom', title: 'Zoom to this Spot'},
    {key: 'delete', title: 'Delete this Spot'},
    {key: 'nesting', title: 'Show Nesting'},
  ];

  const continueDeleteSelectedSpot = () => {
    if (errorMessage) {
      setErrorMessage('');
      setIsDeleteSpotModalVisible(false);
    }
    else if (isStratInterval(spot)) deleteInterval(spot);
    else deleteSpot(spot.properties.id);
  };

  const deleteSelectedSpot = () => {
    const safeDeleteMessage = checkIsSafeDelete(spot);
    if (safeDeleteMessage) setErrorMessage(safeDeleteMessage);
    setIsDeleteSpotModalVisible(true);
  };

  const onPress = (key) => {
    if (key === 'copy') {
      copySpot().catch(err => console.log('Error copying Spot!', err));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    else if (key === 'zoom') {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
      setTimeout(() => {
        zoomToSpots([spot]);
        dispatch(setLoadingStatus({view: 'home', bool: false}));
      }, 500);
    }
    else if (key === 'delete') deleteSelectedSpot();
    else if (key === 'nesting') dispatch(setNotebookPageVisible(PAGE_KEYS.NESTING));
    closeNotebookMenu();
  };

  const renderActionItem = ({item}) => {
    if (isReadOnly && item.key === 'delete') return;
    else {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          key={item.key}
          onPress={() => onPress(item.key)}
        >
          <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
        </ListItem>
      );
    }
  };

  const renderDeleteMessage = () => {
    return (
      errorMessage ? <Text>Unable to delete spot.{'\n'}{errorMessage}</Text>
        : <Text>Are you sure you want to delete Spot: {spot.properties.name}?</Text>
    );
  };

  return (
    <>
      <ModalWrapper
        closeModal={closeNotebookMenu}
        headerTitle={'Spot Actions'}
        isVisible={isNotebookMenuVisible}
        onBackdropPress={closeNotebookMenu}
        overlayStyleOverride={notebookStyles.dialogContainer}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton={SMALL_SCREEN}
      >
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          contentContainerStyle={{alignItems: 'center'}}
          data={actions}
          key={'notebookActions'}
          renderItem={renderActionItem}
        />
      </ModalWrapper>
      <WarningModal
        onCancelPress={() => setIsDeleteSpotModalVisible(false)}
        confirmText={errorMessage ? 'Ok' : 'Delete'}
        isVisible={isDeleteSpotModalVisible}
        onConfirmPress={continueDeleteSelectedSpot}
        showCancelButton={!errorMessage}
        title={errorMessage ? 'Can\'t Delete Spot' : 'Delete Spot?'}
      >
        {renderDeleteMessage()}
      </WarningModal>
    </>
  );
};

export default NotebookMenu;
