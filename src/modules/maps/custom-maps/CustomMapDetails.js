import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';

import {Icon, Input, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {CUSTOM_MAP_TYPES} from './customMaps.constants';
import customMapStyles from './customMaps.styles';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import {BLUE, DARKGREY, MEDIUMGREY} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui';
import alert from '../../../shared/ui/alert';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import DeleteButton from '../../../shared/ui/buttons/DeleteButton';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import Loading from '../../../shared/ui/Loading';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import SectionDivider from '../../../shared/ui/SectionDivider';
import SliderBar from '../../../shared/ui/SliderBar';
import {formStyles} from '../../form';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {selectedCustomMapToEdit} from '../maps.slice';

const urlKeyboardType = Platform.OS === 'ios' ? 'url' : 'default';

const CustomMapDetails = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const customMapToEdit = useSelector(state => state.map.selectedCustomMapToEdit);
  const MBAccessToken = useSelector(state => state.user.mapboxToken);

  const {deleteMap, saveCustomMap, updateMap} = useCustomMap();

  /* Local State */

  const [editableCustomMapData, setEditableCustomMapData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [message, setMessage] = useState('Starting...');
  const [title, setTitle] = useState('');

  /* Side Effects */

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
  }, [customMapToEdit]);

  /* Event Handlers */

  const handlePress = () => {
    setIsLoadingModalVisible(false);
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MAPS.CUSTOM}));
  };

  /* Logic Helpers */

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

  /* Render Functions */

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

  const renderMapTypeOverview = () => {
    return (
      <View style={{paddingTop: 10}}>
        <SectionDivider dividerText={'Map Details Overview'}/>
        <View style={{padding: 10}}>
          <Text style={customMapStyles.mapOverviewText}>Type: {customMapToEdit.title}</Text>
          {/*<Text style={customMapStyles.mapOverviewText}>Source: {customMapToEdit?.url[0]}</Text>*/}
          <Text style={customMapStyles.mapOverviewText}>Id: {customMapToEdit.id}</Text>
        </View>
      </View>
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

  const renderTitle = () => {
    return (
      <>
        <SectionDivider dividerText={'Custom Map Title'}/>
        <Input
          containerStyle={{paddingHorizontal: 10}}
          errorMessage={editableCustomMapData && isEmpty(editableCustomMapData.title) && 'Title is required'}
          errorStyle={customMapStyles.requiredMessage}
          inputContainerStyle={{borderBottomWidth: 0}}
          inputStyle={formStyles.fieldValue}
          onChangeText={text => setEditableCustomMapData({...editableCustomMapData, title: text})}
          value={editableCustomMapData?.title || ''}
        />
      </>
    );
  };

  /* View */

  return (
    <>
      <View style={{flex: 1}}>
        {renderSidePanelHeader()}
        {renderTitle()}
        {renderOverlaySection()}
        {isEmpty(customMapToEdit) ? renderMapTypeList() : renderMapTypeOverview()}
        {isEmpty(customMapToEdit)
          && (editableCustomMapData?.source === 'mapbox_styles' || editableCustomMapData?.source === 'map_warper'
            || editableCustomMapData?.source === 'strabospot_mymaps') && renderMapDetails()}
        <View style={customMapStyles.bottomButtonsContainer}>
          <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
            <View>
              {!isEmpty(customMapToEdit) && <DeleteButton onPress={confirmDeleteMap}/>}
            </View>
            <ActionButton
              disabled={editableCustomMapData
                && (isEmpty(editableCustomMapData.title) || isEmpty(editableCustomMapData.id)
                  || editableCustomMapData.source === 'map_warper')}
              onPress={saveMap}
              title={!isEmpty(customMapToEdit) ? 'Update' : 'Save'}
            />
          </View>
        </View>
      </View>

      {/* Modal */}
      <ModalWrapper
        actionTitle={'OK'}
        headerTitle={title}
        isVisible={isLoadingModalVisible}
        onActionPressed={handlePress}
        overlayStyleOverride={{flex: 1, maxHeight: '30%'}}
        showCancelButton={false}
      >
        <View style={{flex: 1}}>
          <View style={[overlayStyles.overlayContent, customMapStyles.loadingMapContentContainer]}>
            <Text style={[overlayStyles.titleText]}>{editableCustomMapData.title}</Text>
            <Text style={customMapStyles.loadingMapModalContentText}>{message}</Text>
          </View>
          <View style={{flex: 1}}>
            <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
          </View>
        </View>
      </ModalWrapper>
    </>
  );
};

export default CustomMapDetails;
