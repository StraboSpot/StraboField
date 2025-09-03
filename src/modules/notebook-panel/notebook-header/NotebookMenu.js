import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem, Overlay} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../../shared/common.styles';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import {setLoadingStatus} from '../../home/home.slice';
import {WarningModal} from '../../home/modals';
import overlayStyles from '../../home/overlays/overlay.styles';
import useStratSection from '../../maps/strat-section/useStratSection';
import {PAGE_KEYS} from '../../page/page.constants';
import {useSpots} from '../../spots';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookMenu = ({closeNotebookMenu, isNotebookMenuVisible, zoomToSpots}) => {
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
    if (isStratInterval(spot)) deleteInterval(spot);
    else deleteSpot(spot.properties.id);
  };

  const deleteSelectedSpot = () => {
    setErrorMessage(checkIsSafeDelete(spot));
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

  const renderActionItem = (item) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={item.key}
        onPress={() => onPress(item.key)}
      >
        <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
      </ListItem>
    );
  };

  const renderDeleteMessage = () => {
    return (
      errorMessage ? <Text>Unable to delete spot.{'\n'}{errorMessage}</Text>
        : <Text>Are you sure you want to delete Spot: {spot.properties.name}?</Text>
    );
  };

  return (
    <>
      {isNotebookMenuVisible && (
        <Overlay
          isVisible={isNotebookMenuVisible}
          onBackdropPress={closeNotebookMenu}
          overlayStyle={notebookStyles.dialogContainer}
          supportedOrientations={['portrait', 'landscape']}
        >
          <View style={overlayStyles.titleContainer}>
            <Text style={overlayStyles.titleText}>Spot Actions</Text>
          </View>
          <FlatList
            ItemSeparatorComponent={FlatListItemSeparator}
            contentContainerStyle={{alignItems: 'center'}}
            data={actions}
            key={'notebookActions'}
            renderItem={({item}) => renderActionItem(item)}
          />
        </Overlay>
      )}
      {isDeleteSpotModalVisible && (
        <WarningModal
          closeModal={() => setIsDeleteSpotModalVisible(false)}
          closeTitle={errorMessage ? 'Ok' : 'Cancel'}
          confirmText={'DELETE'}
          confirmTitleStyle={overlayStyles.importantText}
          isVisible={isDeleteSpotModalVisible}
          onConfirmPress={() => continueDeleteSelectedSpot()}
          showCancelButton={true}
          showConfirmButton={isDeleteSpotModalVisible && !errorMessage}
          title={'Delete Spot?'}
        >
          {renderDeleteMessage()}
        </WarningModal>
      )}
    </>
  );
};

export default NotebookMenu;
