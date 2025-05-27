import React, {useEffect, useMemo, useState} from 'react';
import {Animated, FlatList, Platform, Text, View} from 'react-native';

import {Button, Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {editedOfflineMap, setOfflineMapVisible} from './offlineMaps.slice';
import styles from './offlineMaps.styles';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, truncateText} from '../../../shared/Helpers';
import alert from '../../../shared/ui/alert';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../../shared/ui/ListEmptyText';
import Loading from '../../../shared/ui/Loading';
import SectionDividerWithRightButton from '../../../shared/ui/SectionDividerWithRightButton';
import TextInputModal from '../../../shared/ui/TextInputModal';
import {setIsOfflineMapsModalVisible} from '../../home/home.slice';
import {WarningModal} from '../../home/modals';
import useMap from '../useMap';

const ManageOfflineMaps = ({closeMainMenuPanel, zoomToCenterOfflineTile}) => {
  console.log('Rendering ManageOfflineMaps...');

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const {isSelected} = useSelector(state => state.connections.databaseEndpoint);

  const animatedPulse = useMemo(() => new Animated.Value(1), []);

  const [availableMaps, setAvailableMaps] = useState({});
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState({});

  const {deleteOfflineMap} = useDevice();
  const {setBasemap} = useMap();
  const {getSavedMapsFromDevice, switchToOfflineMap} = useMapsOffline();

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

  const renderEditMapModal = () => {
    return (
      <TextInputModal
        dialogTitle={'Edit Map Name'}
        placeholder={selectedMap.name}
        style={styles.dialogTitle}
        visible={isNameModalVisible}
        onPress={() => saveMapEdits()}
        closeModal={() => setIsNameModalVisible(false)}
        value={selectedMap.name}
        onChangeText={text => setSelectedMap({...selectedMap, name: text})}
      >
        <Button
          type={'clear'}
          icon={
            <Icon
              name={'trash-outline'}
              type={'ionicon'}
              color={'red'}
            />
          }
          onPress={() => confirmDeleteMap()}
        />
      </TextInputModal>
    );
  };

  const renderMapsList = () => {
    return (
      <FlatList
        keyExtractor={item => item.id}
        data={Object.values(offlineMaps)}
        renderItem={({item}) => renderMapsListItem(item)}
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={
          <ListEmptyText
            text={'No Offline Maps.\n\nIf you just logged in press the reload button in the upper right to load your offline maps from the device.\n\nTo download a map select area and zoom'
              + ' level on map then select "Download tiles of current map"'}
            textStyle={{textAlign: 'center'}}
            containerStyle={{padding: 20}}
          />}
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
                  containerStyle={{margin: 5}}
                  name={'alert'}
                  type={'material-community'}
                  size={17}
                  color={'red'}
                />
              </Animated.View>
            )}
            {isOnline.isInternetReachable && (
              <Button
                onPress={() => toggleOfflineMap(item)}
                disabled={item.count === 0}
                containerStyle={{marginRight: 20}}
                titleStyle={commonStyles.viewMapsButtonText}
                type={'clear'}
                icon={<Icon
                  type={'ionicon'}
                  size={20}
                  name={item.isOfflineMapVisible ? 'eye-off-outline' : item.count === 0 ? 'No tiles to view' : 'eye-outline'}
                />}
              />
            )}
            {item.id !== 'mapbox.outdoors' && item.id !== 'mapbox.satellite' && item.id !== 'osm' && item.id !== 'macrostrat'
              && <Button
                onPress={() => editMap(item)}
                type={'clear'}
                icon={
                  <Icon
                    type={'material'}
                    name={'edit'}
                    size={15}
                  />
                }
              />}
          </View>
          {/*</View>*/}
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderWarningModal = () => {
    return (
      <WarningModal
        title={'Map Not Available!'}
        isVisible={isWarningModalVisible}
      >
        <Text>Selected map is not available for offline use. Switching to first available map: {selectedMap.name}</Text>
      </WarningModal>
    );
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

  return (
    <>
      <Button
        title={'Download tiles of current map'}
        disabled={(!isOnline.isInternetReachable && !isOnline.isConnected) || isSelected
          || Object.values(offlineMaps).some(map => map.isOfflineMapVisible === true)}
        onPress={() => {
          closeMainMenuPanel();
          dispatch(setIsOfflineMapsModalVisible(true));
        }}
        containerStyle={styles.buttonContainer}
        buttonStyle={commonStyles.standardButton}
        titleStyle={commonStyles.standardButtonText}
      />
      <SectionDividerWithRightButton
        dividerText={'Offline Maps'}
        iconName={'reload-outline'}
        iconType={'ionicon'}
        iconSize={20}
        onPress={() => updateMapsFromDevice()}
      />
      {!loading && renderMapsList()}
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
