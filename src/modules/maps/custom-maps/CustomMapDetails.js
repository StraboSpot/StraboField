import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Button, Icon, Input, ListItem, Overlay} from '@rn-vui/base';
import {Col, Row, Rows, Table, TableWrapper} from 'react-native-reanimated-table';
import {useDispatch, useSelector} from 'react-redux';

import customMapStyles from './customMaps.styles';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import {BLUE, DARKGREY, MEDIUMGREY, WARNING_COLOR} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import alert from '../../../shared/ui/alert';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import Loading from '../../../shared/ui/Loading';
import SectionDivider from '../../../shared/ui/SectionDivider';
import SliderBar from '../../../shared/ui/SliderBar';
import {formStyles} from '../../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../../home/home.slice';
import overlayStyles from '../../home/overlays/overlay.styles';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {CUSTOM_MAP_TYPES} from '../maps.constants';
import {selectedCustomMapToEdit} from '../maps.slice';
import useMapCoords from '../useMapCoords';

const urlKeyboardType = Platform.OS === 'ios' ? 'url' : 'default';
// const {State: TextInputState} = TextInput;

const CustomMapDetails = () => {
  let defaultBbox = [['N/A', 'N/A'], ['N/A', 'N/A']];
  const {deleteMap, saveCustomMap, updateMap} = useCustomMap();
  const {getMyMapsBboxCoords} = useMapCoords();

  const dispatch = useDispatch();
  const MBAccessToken = useSelector(state => state.user.mapboxToken);
  const customMapToEdit = useSelector(state => state.map.selectedCustomMapToEdit);
  const isOnline = useSelector(state => state.connections.isOnline);

  const [bboxCoords, setBboxCoords] = useState(defaultBbox);
  const [editableCustomMapData, setEditableCustomMapData] = useState({});
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [message, setMessage] = useState('Starting...');
  const [bboxMessage, setBboxMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!isEmpty(customMapToEdit)) setEditableCustomMapData(customMapToEdit);
    else {
      setEditableCustomMapData({
        title: '',
        opacity: 1,
        overlay: false,
        id: '',
        source: '',
        key: MBAccessToken,
      });
    }
    // if (customMapToEdit && isEmpty(customMapToEdit?.bbox && isOnline.isConnected)) {
    //   getMyMapsBboxCoords(customMapToEdit)
    //     .then((bboxCoords) => {
    //       getBboxData(bboxCoords);
    //       updateMap({...customMapToEdit, bbox: bboxCoords});
    //     });
    // }
    // else getBboxData(customMapToEdit.bbox);
  }, [customMapToEdit]);

  const saveMap = async () => {
    try {
      setIsLoadingModalVisible(true);
      setIsLoading(true);
      if (!isEmpty(customMapToEdit)) {
        setTitle('Updating Custom Map');
        setMessage(`Updating Existing Map...\n\n${customMapToEdit.title}`);
        updateMap(editableCustomMapData);
      }
      else {
        setTitle('Saving Custom Map');
        setMessage(`Saving New Map...\n\n${editableCustomMapData.title}`);
        const customMap = await saveCustomMap(editableCustomMapData);
        console.log(customMap);
      }
      setMessage('Success!');
      setIsLoading(false);
    }
    catch (err) {
      console.error('Error saving custom map', err);
      setTitle('Something went wrong!');
      setMessage(err);
      setIsLoading(false);
    }
  };

  const confirmDeleteMap = async () => {
    alert(
      'Delete Custom Map',
      'Are your sure you want to delete ' + customMapToEdit.title + '?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteMap(customMapToEdit.id),
        },
      ],
      {cancelable: false},
    );
  };

  // const getBoundingBox = async () => {
  //   setIsLoading(true);
  //   const bbox = await useMapCoords.getMyMapsBboxCoords(customMapToEdit);
  //   setEditableCustomMapData(prevState => ({...prevState, bbox: bbox}));
  //   setIsLoading(false);
  //   setBboxMessage('Be sure to UPDATE map to save bounding box.');
  // };

  const handlePress = () => {
    setIsLoadingModalVisible(false);
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MAPS.CUSTOM}));
  };

  const renderCustomMapName = (item) => {
    const radioSelected = <Icon color={BLUE} name={'radiobox-marked'} type={'material-community'}/>;
    const radioUnselected = <Icon color={DARKGREY} name={'radiobox-blank'} type={'material-community'}/>;
    return (
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.CheckBox
          checked={item.source === editableCustomMapData?.source}
          checkedIcon={radioSelected}
          onPress={() => setEditableCustomMapData(e => ({...e, source: item.source}))}
          uncheckedIcon={radioUnselected}
        />
      </ListItem>
    );
  };

  const renderMapDetails = () => {
    return (
      <>
        <SectionDivider dividerText={'Map Details'}/>
        <View>
          {editableCustomMapData?.source === 'mapbox_styles' && (
            <Input
              containerStyle={{paddingHorizontal: 0}}
              errorMessage={editableCustomMapData && isEmpty(editableCustomMapData.id) && 'Style URL is required'}
              errorStyle={customMapStyles.requiredMessage}
              inputContainerStyle={{borderBottomWidth: 0}}
              inputStyle={{...formStyles.fieldValue, backgroundColor: 'white'}}
              keyboardType={urlKeyboardType}
              onChangeText={text => setEditableCustomMapData(e => ({...e, id: text}))}
              placeholder={'Style URL'}
              placeholderTextColor={MEDIUMGREY}
              value={editableCustomMapData.id}
            />
          )}
          {editableCustomMapData?.source === 'strabospot_mymaps' && (
            <Input
              containerStyle={{paddingHorizontal: 0}}
              errorMessage={editableCustomMapData && isEmpty(editableCustomMapData.id) && 'Map ID is required'}
              errorStyle={customMapStyles.requiredMessage}
              inputContainerStyle={{borderBottomWidth: 0}}
              inputStyle={{...formStyles.fieldValue, backgroundColor: 'white'}}
              onChangeText={text => setEditableCustomMapData(e => ({...e, id: text}))}
              placeholder={'Strabo My Maps ID'}
              placeholderTextColor={MEDIUMGREY}
              value={editableCustomMapData.id}
            />
          )}
        </View>
        {!isEmpty(customMapToEdit) && <View style={customMapStyles.mapTypeInfoContainer}>
          <Text style={customMapStyles.mapTypeInfoText}>Map available from:</Text>
          <Text style={customMapStyles.mapTypeInfoText}>{customMapToEdit?.url[0]}</Text>
        </View>}
      </>
    );
  };

  const renderMapTypeList = () => (
    <View>
      <SectionDivider dividerText={'Map Type'}/>
      <View style={customMapStyles.mapTypeInfoContainer}>
        <Text style={customMapStyles.mapTypeInfoText}>
          If you wish to save a new MapWarper map please download the <Text style={{fontWeight: 'bold'}}>.tiff </Text>
          file from Mapwarper.net and upload it into your Strabo MyMaps account.
        </Text>
      </View>
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={CUSTOM_MAP_TYPES}
        keyExtractor={item => item.source}
        renderItem={({item, index}) => renderCustomMapName(item, index)}
      />
      {editableCustomMapData?.source === ''
        && <Text style={customMapStyles.requiredMessage}>Map type is required</Text>}
    </View>
  );

  const getBboxData = (bboxCoords) => {
    try {
      if (!isEmpty(bboxCoords)) {
        const bboxArr = bboxCoords.split(',');
        setBboxCoords([[bboxArr[0], bboxArr[1]], [bboxArr[2], bboxArr[3]]]);
      }
      else setBboxCoords(defaultBbox);
    }
    catch (err) {
      console.error('Error getting bbox coords', err);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('There was an error getting the bounding box coordinates of the custom map.\n'
        + 'Please pan to the map manually.'));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  const bboxCoordsLayout = () => {
    return (
      <View style={customMapStyles.bboxCoordsContainers}>
        <Table style={{}}>
          <Row data={['', 'Longitude', 'Latitude']} flexArr={[1, 2, 2]} style={customMapStyles.bboxTableHead}
               textStyle={customMapStyles.bboxText}/>
          <TableWrapper style={{flexDirection: 'row'}}>
            <Col data={['SW', 'NE']} heightArr={[25, 25]} style={customMapStyles.bboxColumnContainer}
                 textStyle={customMapStyles.bboxText}/>
            <Rows data={bboxCoords} flexArr={[2, 2]} style={customMapStyles.bboxRowContainer}
                  textStyle={customMapStyles.bboxText}/>
          </TableWrapper>
          <View style={customMapStyles.bboxCoordsContainers}>
            <Text style={customMapStyles.bboxMessageText}>{bboxMessage}</Text>
          </View>
        </Table>
      </View>
    );
  };

  const renderMapTypeOverview = () => {
    return (
      <View style={{paddingTop: 10}}>
        <SectionDivider dividerText={'Map Details Overview'}/>
        <View style={{padding: 10}}>
          <Text style={customMapStyles.mapOverviewText}>Type: {customMapToEdit.title}</Text>
          {/*<Text style={customMapStyles.mapOverviewText}>Source: {customMapToEdit?.url[0]}</Text>*/}
          <Text style={customMapStyles.mapOverviewText}>Id: {customMapToEdit.id}</Text>
        </View>
        {/*{isOnline.isConnected && bboxCoordsLayout()}*/}
      </View>
    );
  };

  const renderTitle = () => {
    return (
      <>
        <SectionDivider dividerText={'Custom Map Title'}/>
        <Input
          containerStyle={{paddingHorizontal: 0}}
          errorMessage={editableCustomMapData && isEmpty(editableCustomMapData.title) && 'Title is required'}
          errorStyle={customMapStyles.requiredMessage}
          inputContainerStyle={{borderBottomWidth: 0}}
          inputStyle={{...formStyles.fieldValue, backgroundColor: 'white'}}
          onChangeText={text => setEditableCustomMapData({...editableCustomMapData, title: text})}
          value={editableCustomMapData?.title || ''}
        />
      </>
    );
  };

  const renderOverlaySection = () => {
    const opacity = editableCustomMapData?.opacity && typeof (editableCustomMapData.opacity) === 'number'
    && editableCustomMapData.opacity >= 0 && editableCustomMapData.opacity <= 1 ? editableCustomMapData.opacity : 1;
    const sliderValuePercent = Math.round(opacity * 100).toFixed(0);
    return (
      <>
        <SectionDivider dividerText={'Overlay Settings'}/>
        <Text style={{padding: 10}}>To save this map as an overlay for offline use first save as a basemap then switch
          it to an overlay.</Text>
        <ListItem containerStyle={commonStyles.listItem}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>Display as overlay</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper
            onValueChange={val => setEditableCustomMapData(e => ({...e, overlay: val}))}
            value={editableCustomMapData?.overlay}
          />
        </ListItem>
        {editableCustomMapData?.overlay && (
          <ListItem containerStyle={commonStyles.listItem}>
            <ListItem.Content>
              <ListItem.Title style={commonStyles.listItemTitle}>Opacity</ListItem.Title>
              <ListItem.Subtitle style={{paddingLeft: 10}}>{sliderValuePercent}%</ListItem.Subtitle>
            </ListItem.Content>
            <View style={{flex: 2}}>
              <SliderBar
                labels={['5%', '50%', '100%']}
                maximumValue={1}
                minimumValue={0.05}
                onValueChange={val => setEditableCustomMapData(e => ({...e, opacity: val}))}
                rotateLabels
                step={0.05}
                value={opacity}
              />
            </View>
          </ListItem>
        )}
      </>
    );
  };

  const renderSidePanelHeader = () => {
    return (
      <SidePanelHeader
        backButton={() => {
          dispatch(setSidePanelVisible({bool: false}));
          dispatch(selectedCustomMapToEdit({}));
        }}
        headerTitle={!isEmpty(customMapToEdit) ? 'Edit Map' : 'Add Map'}
        title={'Custom Maps'}
      />
    );
  };

  return (
    <>
      <View style={{flex: 1}}>
        {renderSidePanelHeader()}
        {renderTitle()}
        {renderOverlaySection()}
        {isEmpty(customMapToEdit) ? renderMapTypeList() : renderMapTypeOverview()}
        {isEmpty(
          customMapToEdit) && (editableCustomMapData?.source === 'mapbox_styles' || editableCustomMapData?.source === 'map_warper'
          || editableCustomMapData?.source === 'strabospot_mymaps') && renderMapDetails()}
        <View style={customMapStyles.bottomButtonsContainer}>
          <Button
            containerStyle={commonStyles.standardButtonContainer}
            disabled={editableCustomMapData && (isEmpty(editableCustomMapData.title) || isEmpty(
                editableCustomMapData.id)
              || editableCustomMapData.source === 'map_warper')}
            onPress={() => saveMap()}
            title={!isEmpty(customMapToEdit) ? 'Update' : 'Save'}
            type={'clear'}
          />
          <Button
            containerStyle={commonStyles.standardButtonContainer}
            onPress={() => confirmDeleteMap()}
            title={'Delete Map'}
            titleStyle={{color: WARNING_COLOR}}
            type={'clear'}
          />
        </View>
      </View>
      <Overlay
        isVisible={isLoadingModalVisible}
        overlayStyle={[overlayStyles.overlayContainer, customMapStyles.loadingMapModalContainer]}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={{flex: 1}}>
          <View style={[overlayStyles.titleContainer, customMapStyles.loadingMapModalTitleContainer]}>
            <Text style={[overlayStyles.titleText]}>{title}</Text>
          </View>
          <View style={[overlayStyles.overlayContent, customMapStyles.loadingMapContentContainer]}>
            <Text style={[overlayStyles.titleText]}>{editableCustomMapData.title}</Text>
            <Text style={customMapStyles.loadingMapModalContentText}>{message}</Text>
          </View>
          <View style={customMapStyles.loadingMapButtonContainer}>
            <Button
              disabled={isLoading}
              onPress={handlePress}
              title={'Ok'}
              type={'clear'}
            />
          </View>
          <View style={{flex: 1}}>
            <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
          </View>
        </View>
      </Overlay>
    </>
  );
};

export default CustomMapDetails;
