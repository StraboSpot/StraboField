import React, {useState} from 'react';
import {FlatList, Text} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import RockdModal from '../../../services/data-intergration/macrostrat/RockdModal';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import {WarningModal} from '../../../shared/ui/modals';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {setLoadingStatus} from '../../home/home.slice';
import useStratSection from '../../maps/strat-section/useStratSection';
import {PAGE_KEYS} from '../../page/pageKeys.constants';
import IGSNModal from '../../samples/igsn/IGSNModal';
import useSamples from '../../samples/useSamples';
import {useSpots} from '../../spots';
import {setInitialSesarState} from '../../user/userProfile.slice';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookMenu = ({
                        closeNotebookMenu,
                        closeNotebookPanel,
                        isNotebookMenuVisible,
                        isReadOnly,
                        isSample,
                        parentSpot,
                        selectedSample,
                        zoomToSpots,
                      }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const checkedInSpotIds = useSelector(state => state.user.macrostrat?.checkedInSpotIds ?? []);
  const isTestingMode = useSelector(state => state.project.isTestingMode);
  const {sesarToken} = useSelector(state => state.user.sesar);

  const navigation = useNavigation();
  const toast = useToast();
  const {deleteRichSample} = useSamples();
  const {checkIsSafeDelete, copySpot, deleteSpot, isStratInterval} = useSpots();
  const {deleteInterval} = useStratSection();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteSpotModalVisible, setIsDeleteSpotModalVisible] = useState(false);
  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);
  const [isRockdModalVisible, setIsRockdModalVisible] = useState(false);

  /* Derived Variables */

  const type = isSample ? 'Sample' : 'Spot';
  const sampleIGSN = selectedSample?.Sample_IGSN ?? spot.properties?.samples?.[0]?.Sample_IGSN;
  const actions = [
    ...(!isSample ? [{key: 'copy', title: `Copy this ${type}`}] : []),
    {key: 'zoom', title: `Zoom to this ${type}`},
    {key: 'delete', title: `Delete this ${type}`},
    {key: 'geography', title: 'Show Geography'},
    {key: 'metadata', title: 'Show Metadata'},
    {key: 'nesting', title: 'Show Nesting'},
    ...(!isSample ? [{key: 'rockd', title: 'Send Spot to Rockd'}] : []),
    ...(spot.properties?.isSample ? [{key: 'igsn', title: sampleIGSN ? 'View IGSN Data' : 'Get IGSN'}] : []),
    ...(isSample && !isEmpty(sesarToken?.access) ? [{key: 'resetSesar', title: 'Reset SESAR Credentials'}] : []),
    ...(!SMALL_SCREEN ? [{key: 'close', title: 'Close Notebook'}] : []),
  ];

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
    else if (key === 'igsn') {
      if (sampleIGSN) dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));
      else setIsIGSNModalVisible(true);
    }
    else if (key === 'rockd') {
      closeNotebookMenu();
      setIsRockdModalVisible(true);
    }
    else if (key === 'resetSesar') {
      dispatch(setInitialSesarState());
      toast.show('Sesar credentials have been reset', {type: 'success'});
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
    else if (spot.properties?.isSample) deleteRichSample(spot, parentSpot);
    else if (isStratInterval(spot)) deleteInterval(spot);
    else deleteSpot(spot);
  };

  const deleteSelectedSpot = () => {
    const safeDeleteMessage = checkIsSafeDelete(spot);
    if (safeDeleteMessage) setErrorMessage(safeDeleteMessage);
    setIsDeleteSpotModalVisible(true);
  };

  /* Render Functions */

  const renderActionItem = ({item}) => {
    if (isReadOnly && item.key === 'delete') return;
    else if (item.key === 'rockd' && !isTestingMode
      && (checkedInSpotIds.includes(spot.properties.id) || spot.geometry.type !== 'Point')) return;
    else if (item.key === 'rockd' && !isTestingMode) return;
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
        : (
          <Text>
            Are you sure you want to delete {isSample ? 'Sample' : 'Spot'}: {spot.properties.name}?
          </Text>
        )
    );
  };

  /* View */

  return (
    <>
      <ModalWrapper
        closeModal={closeNotebookMenu}
        headerTitle={isSample ? 'Sample Actions' : 'Spot Actions'}
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
        confirmText={errorMessage ? 'Ok' : 'Delete'}
        isVisible={isDeleteSpotModalVisible}
        onCancelPress={() => setIsDeleteSpotModalVisible(false)}
        onConfirmPress={continueDeleteSelectedSpot}
        showCancelButton={!errorMessage}
        title={isSample ? 'Delete Sample?' : 'Delete Spot?'}
      >
        {renderDeleteMessage()}
      </WarningModal>
      <RockdModal
        closeModal={() => setIsRockdModalVisible(false)}
        isVisible={isRockdModalVisible}
      />
      <IGSNModal
        isVisible={isIGSNModalVisible}
        onIGSNUpdated={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
        onModalCancel={() => setIsIGSNModalVisible(false)}
        sampleValues={!isEmpty(selectedSample) ? selectedSample : spot.properties?.samples?.[0]}
      />
    </>
  );
};

export default NotebookMenu;
