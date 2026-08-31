import React, {useState} from 'react';
import {FlatList, Platform, Text, TextInput, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {CUSTOM_MAP_TYPES} from './customMaps.constants';
import {getMapTypeName, normalizeCustomMapId} from './customMaps.helpers';
import customMapStyles from './customMaps.styles';
import useCustomMap from './useCustomMap';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, openUrl, toError} from '../../../shared/helpers';
import {BLUE, DARKGREY} from '../../../shared/styles.constants';
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
import {FormikWrapper, formStyles, TextInputField} from '../../form';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/sidePanel/SidePanelHeader';
import {selectedCustomMapToEdit} from '../maps.slice';

const urlKeyboardType = Platform.OS === 'ios' ? 'url' : 'default';

const CustomMapDetails = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const customMapToEdit = useSelector(state => state.map.selectedCustomMapToEdit);

  const {deleteMap, saveCustomMap, updateMap} = useCustomMap();

  /* Local State */

  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModalVisible, setIsLoadingModalVisible] = useState(false);
  const [message, setMessage] = useState('Starting...');
  const [modalTitle, setModalTitle] = useState('');

  /* Derived Variables */

  // Seeded with the whole map, so the keys the form never shows - its url, its stored extent - survive the save
  const initialCustomMapValues = isEmpty(customMapToEdit)
    ? {title: '', opacity: 1, overlay: false, id: '', source: ''}
    : customMapToEdit;

  /* Event Handlers */

  const handleBackPress = (formProps) => {
    if (!formProps.dirty) closeSidePanel();
    // Save is held while the map is incomplete, so there is nothing to offer but leaving the changes behind
    else if (isFormInvalid) {
      alert('Unsaved Changes', 'This map cannot be saved until it is complete. Leave without saving?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Leave', onPress: closeSidePanel},
      ], {cancelable: false});
    }
    // Saving keeps the panel open for the modal that reports how it went, which closes it from its own OK button
    else {
      alert('Unsaved Changes', 'Would you like to save your data before continuing?', [
        {text: 'No', style: 'cancel', onPress: closeSidePanel},
        {text: 'Yes', onPress: () => saveMap(formProps.values)},
      ], {cancelable: false});
    }
  };

  const handleModalActionPress = () => {
    setIsLoadingModalVisible(false);
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MAPS.CUSTOM}));
  };

  const handleUrlPress = async (url) => {
    try {
      await openUrl(url);
    }
    catch (err) {
      console.error('Error opening custom map url', url, err);
      alert('Unable to Open Link', `Could not open ${url} in a browser.`);
    }
  };

  /* Logic Helpers */

  const closeSidePanel = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(selectedCustomMapToEdit({}));
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

  const saveMap = async (customMapValues) => {
    try {
      setIsLoadingModalVisible(true);
      setIsLoading(true);
      if (!isEmpty(customMapToEdit)) {
        const isIdChanged = normalizeCustomMapId(customMapValues.id, customMapValues.source) !== customMapToEdit.id;
        setModalTitle('Updating Custom Map');
        setMessage(`Updating Existing Map...\n\n${customMapToEdit.title}`);
        // A new id has to go through saveCustomMap so it gets validated and the map (and its cached tiles) move to
        // the new key. Everything else stays on updateMap, which needs no network.
        if (isIdChanged) await saveCustomMap(customMapValues, customMapToEdit.id);
        else updateMap(customMapValues);
      }
      else {
        setModalTitle('Saving Custom Map');
        setMessage(`Saving New Map...\n\n${customMapValues.title}`);
        const customMap = await saveCustomMap(customMapValues);
        console.log('Saved Custom Map:', customMap);
      }
      setMessage('Success!');
      setIsLoading(false);
    }
    catch (err) {
      console.error('Error saving custom map', err);
      setModalTitle('Something went wrong!');
      setMessage(toError(err).message);
      setIsLoading(false);
    }
  };

  // Checked together so each missing piece marks its own field, and Save is held until the map can be saved
  const validateCustomMap = (values) => {
    const errors = {};
    if (isEmpty(values.title)) errors.title = 'Title is required';
    if (isEmpty(values.source)) errors.source = 'Map type is required';
    // A Map Warper map is identified by the file uploaded to Strabo MyMaps rather than by anything typed here
    else if (values.source !== 'map_warper' && isEmpty(values.id)) {
      errors.id = values.source === 'mapbox_styles' ? 'Style URL is required' : 'Map ID is required';
    }
    return errors;
  };

  /* Render Functions */

  const renderCustomMapName = (item, formProps) => {
    const radioSelected = <Icon color={BLUE} name={'radiobox-marked'} type={'material-community'}/>;
    const radioUnselected = <Icon color={DARKGREY} name={'radiobox-blank'} type={'material-community'}/>;
    return (
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.CheckBox
          checked={item.source === formProps.values.source}
          checkedIcon={radioSelected}
          onPress={() => formProps.setFieldValue('source', item.source)}
          uncheckedIcon={radioUnselected}
        />
      </ListItem>
    );
  };

  const renderMapDetails = (formProps) => {
    const mapUrl = customMapToEdit?.url?.[0];
    const mapTypeName = getMapTypeName(formProps.values.source);
    return (
      <>
        <SectionDivider dividerText={'Map Details'}/>
        {/* Chosen from the list above while adding, and settled once saved. A legacy Map Warper map has no name */}
        {!isEmpty(customMapToEdit) && !!mapTypeName && (
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Map Type'}</Text>
              </View>
              <TextInput editable={false} style={formStyles.fieldValue} value={mapTypeName}/>
            </ListItem.Content>
          </ListItem>
        )}
        {formProps.values.source === 'mapbox_styles' && (
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <TextInputField
                isRequired={true}
                keyboardType={urlKeyboardType}
                label={'Style URL'}
                name={'id'}
              />
            </ListItem.Content>
          </ListItem>
        )}
        {formProps.values.source === 'strabospot_mymaps' && (
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <TextInputField
                isRequired={true}
                label={'Strabo My Maps ID'}
                name={'id'}
              />
            </ListItem.Content>
          </ListItem>
        )}
        {!isEmpty(mapUrl) && <View style={customMapStyles.mapTypeInfoContainer}>
          <Text style={customMapStyles.mapTypeInfoText}>Map available from:</Text>
          <Text
            onPress={() => handleUrlPress(mapUrl)}
            style={[customMapStyles.mapTypeInfoText, customMapStyles.mapUrlLink]}
          >
            {mapUrl}
          </Text>
        </View>}
      </>
    );
  };

  const renderMapTypeList = formProps => (
    <View>
      <SectionDivider
        dividerText={'Map Type'}
        subtitle={'If you wish to save a new MapWarper map please download the .tiff file from Mapwarper.net and'
          + ' upload it into your Strabo MyMaps account.'}
      />
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        data={CUSTOM_MAP_TYPES}
        keyExtractor={item => item.source}
        renderItem={({item}) => renderCustomMapName(item, formProps)}
      />
      {/* A list has no field label to carry an asterisk, so the message is all it has to say it is needed */}
      {!!formProps.errors.source && (
        <Text style={[formStyles.fieldError, customMapStyles.mapTypeErrorMessage]}>{formProps.errors.source}</Text>
      )}
    </View>
  );

  const renderOverlaySection = (formProps) => {
    // An opacity never set, or saved outside the slider's range, shows as fully opaque
    const savedOpacity = formProps.values.opacity;
    const opacity = savedOpacity && typeof savedOpacity === 'number' && savedOpacity >= 0 && savedOpacity <= 1
      ? savedOpacity : 1;
    const sliderValuePercent = Math.round(opacity * 100).toFixed(0);
    return (
      <>
        <SectionDivider
          dividerText={'Overlay Settings'}
          subtitle={'To save this map as an overlay for offline use first save as a basemap then switch it to an'
            + ' overlay.'}
        />
        <ListItem containerStyle={commonStyles.listItem}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>Display as overlay</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper
            onValueChange={val => formProps.setFieldValue('overlay', val)}
            value={formProps.values.overlay}
          />
        </ListItem>
        {formProps.values.overlay && (
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
                onValueChange={val => formProps.setFieldValue('opacity', val)}
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

  const renderSidePanelHeader = formProps => (
    <SidePanelHeader
      backButton={() => handleBackPress(formProps)}
      headerTitle={!isEmpty(customMapToEdit) ? 'Edit Custom Map' : 'Add Custom Map'}
      title={'Custom Maps'}
    />
  );

  const renderTitle = () => (
    <ListItem containerStyle={commonStyles.listItemFormField}>
      <ListItem.Content>
        <TextInputField
          isRequired={true}
          label={'Custom Map Title'}
          name={'title'}
        />
      </ListItem.Content>
    </ListItem>
  );

  /* View */

  return (
    <FormikWrapper
      enableReinitialize={true}
      initialValues={initialCustomMapValues}
      setIsFormInvalid={setIsFormInvalid}
      validate={validateCustomMap}
    >
      {formProps => (
        <>
          <View style={{flex: 1}}>
            {renderSidePanelHeader(formProps)}
            {renderTitle()}
            {renderOverlaySection(formProps)}
            {isEmpty(customMapToEdit) && renderMapTypeList(formProps)}
            {!isEmpty(formProps.values.source) && renderMapDetails(formProps)}
            <View style={customMapStyles.bottomButtonsContainer}>
              <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
                <View>
                  {!isEmpty(customMapToEdit) && <DeleteButton onPress={confirmDeleteMap}/>}
                </View>
                <ActionButton
                  // A Map Warper map is uploaded to Strabo MyMaps, never saved from here
                  disabled={isFormInvalid || formProps.values.source === 'map_warper'}
                  onPress={() => saveMap(formProps.values)}
                  title={!isEmpty(customMapToEdit) ? 'Update' : 'Save'}
                />
              </View>
            </View>
          </View>

          {/* Modal */}
          <ModalWrapper
            actionTitle={'OK'}
            headerTitle={modalTitle}
            isVisible={isLoadingModalVisible}
            onActionPressed={handleModalActionPress}
            overlayStyleOverride={{flex: 1, maxHeight: '30%'}}
            showCancelButton={false}
          >
            <View style={{flex: 1}}>
              <View style={[overlayStyles.overlayContent, customMapStyles.loadingMapContentContainer]}>
                <Text style={[overlayStyles.titleText]}>{formProps.values.title}</Text>
                <Text style={customMapStyles.loadingMapModalContentText}>{message}</Text>
              </View>
              <View style={{flex: 1}}>
                <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
              </View>
            </View>
          </ModalWrapper>
        </>
      )}
    </FormikWrapper>
  );
};

export default CustomMapDetails;
