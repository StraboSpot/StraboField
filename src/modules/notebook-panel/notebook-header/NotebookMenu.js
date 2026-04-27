import React, {useState} from 'react';
import {FlatList, Text} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import RockdModal from '../../../services/data-intergration/macrostrat/RockdModal';
import commonStyles from '../../../shared/common.styles';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import {WarningModal} from '../../../shared/ui/modals';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {setLoadingStatus} from '../../home/home.slice';
import useStratSection from '../../maps/strat-section/useStratSection';
import {PAGE_KEYS} from '../../page/pageKeys.constants';
import {useSpots} from '../../spots';
import {NOTEBOOK_MENU_ACTIONS} from '../notebook.constants';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookMenu = ({closeNotebookMenu, closeNotebookPanel, isNotebookMenuVisible, isReadOnly, zoomToSpots}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const checkedInSpotIds = useSelector(state => state.user.macrostrat?.checkedInSpotIds ?? []);

  const navigation = useNavigation();
  const {checkIsSafeDelete, copySpot, deleteSpot, isStratInterval} = useSpots();
  const {deleteInterval} = useStratSection();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteSpotModalVisible, setIsDeleteSpotModalVisible] = useState(false);
  const [isRockdModalVisible, setIsRockdModalVisible] = useState(false);

  /* Event Handlers */

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
    else if (key === 'geography') dispatch(setNotebookPageVisible(PAGE_KEYS.GEOGRAPHY));
    else if (key === 'metadata') dispatch(setNotebookPageVisible(PAGE_KEYS.METADATA));
    else if (key === 'rockd') {
      closeNotebookMenu();
      setIsRockdModalVisible(true);
    }
    else closeNotebookPanel();
    closeNotebookMenu();
  };

  /* Logic Helpers */

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

  /* Render Functions */

  const renderActionItem = ({item}) => {
    if (isReadOnly && item.key === 'delete') return;
    else if (item.key === 'rockd' && (checkedInSpotIds.includes(
      spot.properties.id) || spot.geometry.type !== 'Point')) return;
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

  /* View */

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
          data={NOTEBOOK_MENU_ACTIONS}
          key={'notebookActions'}
          renderItem={renderActionItem}
        />
      </ModalWrapper>
      <WarningModal
        confirmText={errorMessage ? 'Ok' : 'Delete'}
        isVisible={isDeleteSpotModalVisible}
        onCancelPress={() => setIsDeleteSpotModalVisible(false)}
        onConfirmPress={continueDeleteSelectedSpot}
        showCancelButton={!errorMessage}
        title={errorMessage ? 'Can\'t Delete Spot' : 'Delete Spot?'}
      >
        {renderDeleteMessage()}
      </WarningModal>
      <RockdModal
        closeModal={() => setIsRockdModalVisible(false)}
        isVisible={isRockdModalVisible}
      />
    </>
  );
};

export default NotebookMenu;
