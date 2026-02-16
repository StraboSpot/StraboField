import React, {useEffect, useMemo, useState} from 'react';
import {Animated, FlatList, Platform, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {editedOfflineMap, setOfflineMapVisible} from './offlineMaps.slice';
import styles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../shared/Helpers';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import Loading from '../../../shared/ui/Loading';
import {WarningModal} from '../../../shared/ui/modals';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../../shared/ui/TextInputModal';
import {setIsOfflineMapsModalVisible} from '../../home/home.slice';
import useMap from '../useMap';

const ManageOfflineMaps = ({closeMainMenuPanel, zoomToCenterOfflineTile}) => {
  console.log('Rendering ManageOfflineMaps...');

  /* Data Hooks / State */

  const dispatch = useDispatch();

  const isOnline = useSelector(state => state.connections.isOnline);
  const {isSelected} = useSelector(state => state.connections.databaseEndpoint);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);

  const {deleteOfflineMap} = useDevice();
  const {setBasemap} = useMap();
  const {getSavedMapsFromDevice, switchToOfflineMap} = useMapsOffline();

  const [availableMaps, setAvailableMaps] = useState({});
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState({});

  /* Derived State */

  const animatedPulse = useMemo(() => new Animated.Value(1), []);

  /* Side Effects */

  useEffect(() => {
    Animated.sequence([
      // increase size
      Animated.timing(animatedPulse, {
        useNativeDriver: Platform.OS !== 'web',
        toValue: 2,
        duration: 750,
      }),
      // decrease size
      Animated.timing(animatedPulse, {
        useNativeDriver: Platform.OS !== 'web',
        toValue: 1,
        duration: 500,
      }),
    ]).start();
  }, [animatedPulse]);

  useEffect(() => {
    console.log('UE ManageOfflineMaps [offlineMaps]', offlineMaps);
    setAvailableMaps(offlineMaps);
  }, [offlineMaps]);

  /* Logic Helpers */

  const confirmDeleteMap = async () => {
    alert(
      'Delete Offline Map',
      `Are you sure you want to delete ${selectedMap.count} tiles in ${selectedMap.name}?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            Object.values(availableMaps).filter(mapId => mapId.id !== selectedMap.id);
            deleteOfflineMap(selectedMap);
            setIsNameModalVisible(false);
          },
        },
      ],
      {cancelable: false},
    );
  };

  const editMap = (map) => {
    setSelectedMap(map);
    setIsNameModalVisible(true);
  };

  const getTitle = (map) => {
    let name = map.name;
    if (!map.name) {
      return map.id;
    }
    else return name;
  };

  const handDownloadMapTilesPressed = () => {
    closeMainMenuPanel();
    dispatch(setIsOfflineMapsModalVisible(true));
  };

  const saveMapEdits = () => {
    console.log('Map name saved!', selectedMap.name);
    dispatch(editedOfflineMap(selectedMap));
    setIsNameModalVisible(false);
  };

  const toggleOfflineMap = async (item) => {
    if (item.isOfflineMapVisible) {
      dispatch(setOfflineMapVisible({mapId: item.id, viewable: false}));
      await setBasemap(item.id);
    }
    else {
      dispatch(setOfflineMapVisible({mapId: item.id, viewable: true}));
      const res = await switchToOfflineMap(item.id);
      if (!isEmpty(res)) {
        setSelectedMap(res);
        setIsWarningModalVisible(true);
      }
      else zoomToCenterOfflineTile();
    }
  };

  const updateMapsFromDevice = async () => {
    setLoading(true);
    await getSavedMapsFromDevice();
    console.log('Got maps from device');
    setLoading(false);
  };

  /* Render Functions */

  const renderEditMapModal = () => {
    return (
      <TextInputModal
        dialogTitle={'Edit Map Name'}
        onActionPressed={() => saveMapEdits()}
        onCancelPress={() => setIsNameModalVisible(false)}
        onChangeText={text => setSelectedMap({...selectedMap, name: text})}
        onDeletePress={confirmDeleteMap}
        placeholder={selectedMap.name}
        showDeleteButton={true}
        value={selectedMap.name}
        visible={isNameModalVisible}
      />
    );
  };

  const renderMapsList = () => {
    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText
            containerStyle={{padding: 20}}
            text={'No Offline Maps.\n\nIf you just logged in press the reload button in the upper right to load your offline maps from the device.\n\nTo download a map select area and zoom'
              + ' level on map then select "Download tiles of current map"'}
            textStyle={{textAlign: 'center'}}
          />}
        data={Object.values(offlineMaps)}
        keyExtractor={item => item.id}
        renderItem={({item}) => renderMapsListItem(item)}
      />
    );
  };

  const renderMapsListItem = (item) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItemFormField}
        key={item.id}
      >
        <ListItem.Content style={styles.itemContainer}>
          <View style={{marginLeft: 10}}>
            <ListItem.Title style={commonStyles.listItemTitle}>
              {`${!isEmpty(item) ? truncateText(getTitle(item), 20) : 'No Name'}`}
            </ListItem.Title>
            <ListItem.Subtitle style={styles.itemSubTextStyle}>{item.count} tiles</ListItem.Subtitle>
          </View>
          <View style={{flexDirection: 'row'}}>
            {item.count === 0 && (
              <Animated.View style={{transform: [{scale: animatedPulse}]}}>
                <Icon
                  color={'red'}
                  containerStyle={{margin: 5}}
                  name={'alert'}
                  size={17}
                  type={'material-community'}
                />
              </Animated.View>
            )}
            {isOnline.isInternetReachable && (
              <ClearButton
                disabled={item.count === 0}
                icon={{
                  name: item.isOfflineMapVisible ? 'eye-off-outline' : item.count === 0 ? 'No tiles to view' : 'eye-outline',
                  size: 20,
                  type: 'ionicon',
                }}
                onPress={() => toggleOfflineMap(item)}
              />
            )}
            {item.id !== 'mapbox.outdoors' && item.id !== 'mapbox.satellite' && item.id !== 'osm'
              && item.id !== 'macrostrat' && (
                <ClearButton
                  icon={{name: 'edit', size: 18, type: 'material'}}
                  onPress={() => editMap(item)}
                />
              )}
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderWarningModal = () => {
    return (
      <WarningModal
        isVisible={isWarningModalVisible}
        onConfirmPress={() => setIsWarningModalVisible(false)}
        showCancelButton={false}
        title={'Map Not Available!'}
      >
        <Text>Selected map is not available for offline use. Switching to first available map: {selectedMap.name}</Text>
      </WarningModal>
    );
  };

  /* View */

  return (
    <>
      <OutlineButton
        disabled={(!isOnline.isInternetReachable && !isOnline.isConnected) || isSelected
          || Object.values(offlineMaps).some(map => map.isOfflineMapVisible === true)}
        onPress={handDownloadMapTilesPressed}
        title={'Download Tiles of Current Map'}
      />
      <SectionDividerWithRightButton
        dividerText={'Offline Maps'}
        iconName={'reload-outline'}
        onPress={updateMapsFromDevice}
      />
      {!loading && renderMapsList()}

      {/* Modals */}
      {renderEditMapModal()}
      {renderWarningModal()}
      <Loading
        isLoading={loading}
        text={'Checking and adjusting tile count'}
      />
    </>
  );
};

export default ManageOfflineMaps;
