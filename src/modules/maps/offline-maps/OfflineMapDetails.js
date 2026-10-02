import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {formatTilesSize, getOfflineMapTitle, getTileStats} from './offlineMaps.helpers';
import {editedOfflineMap, selectedOfflineMap} from './offlineMaps.slice';
import useMapsOffline from './useMapsOffline';
import useDevice from '../../../services/device/useDevice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import DeleteButton from '../../../shared/ui/buttons/DeleteButton';
import SectionDivider from '../../../shared/ui/SectionDivider';
import formStyles from '../../form/form.styles';
import FormikWrapper from '../../form/FormikWrapper';
import TextInputField from '../../form/inputs/TextInputField';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import SidePanelHeader from '../../main-menu-panel/side-panel/SidePanelHeader';
import {getMapTypeName} from '../custom-maps/customMaps.helpers';
import customMapStyles from '../custom-maps/customMaps.styles';
import {isDefaultMap} from '../maps.helpers';

const formatCoordinate = coordinate => coordinate.toFixed(4);

const OfflineMapDetails = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const offlineMaps = useSelector(state => state.offlineMap.offlineMaps);
  const previewedOfflineMapId = useSelector(state => state.offlineMap.previewedOfflineMapId);
  const selectedOfflineMapId = useSelector(state => state.offlineMap.selectedOfflineMapId);

  const {deleteOfflineMap, readMapTileFiles} = useDevice();
  const {stopOfflineMapPreview} = useMapsOffline();

  /* Local State */

  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [tileStats, setTileStats] = useState();

  /* Derived Variables */

  const map = offlineMaps[selectedOfflineMapId];
  // A default basemap is named by the app, so only a map the user added can be renamed
  const isRenameable = !!map && !isDefaultMap(map);
  const mapTypeName = map && (isDefaultMap(map) ? 'Default Basemap' : getMapTypeName(map.customMapSource));
  const zoomLevels = Object.keys(tileStats?.zoomCounts || {}).map(Number).sort((a, b) => a - b);

  /* Side Effects */

  // Read again whenever the map's tiles are recounted, so the details never disagree with the list. A map gone from
  // under the panel, deleted or cleared by a reload, leaves nothing to show, so the panel closes.
  useEffect(() => {
    if (!map) {
      closeSidePanel();
      return;
    }
    readMapTileFiles(map.id)
      .then(files => setTileStats(getTileStats(files)))
      .catch((err) => {
        console.error('Error reading the tiles of offline map', map.id, err);
        setTileStats(undefined);
      });
  }, [map?.id, map?.count]);

  /* Event Handlers */

  const handleBackPress = (formProps) => {
    if (!formProps.dirty) closeSidePanel();
    else if (isFormInvalid) {
      alert('Unsaved Changes', 'This map needs a name before it can be saved. Leave without saving?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Leave', onPress: closeSidePanel},
      ], {cancelable: false});
    }
    else {
      alert('Unsaved Changes', 'Would you like to save your data before continuing?', [
        {text: 'No', style: 'cancel', onPress: closeSidePanel},
        {text: 'Yes', onPress: () => saveMapName(formProps.values)},
      ], {cancelable: false});
    }
  };

  /* Logic Helpers */

  const closeSidePanel = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(selectedOfflineMap(null));
  };

  const confirmDeleteMap = () => {
    alert(
      'Delete Offline Map',
      `Are you sure you want to delete ${map.count} tiles in ${getOfflineMapTitle(map)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: deleteMap},
      ],
      {cancelable: false},
    );
  };

  const deleteMap = async () => {
    try {
      // A preview shows this map's tiles as the basemap, so put a live one back before they go
      if (map.id === previewedOfflineMapId) await stopOfflineMapPreview();
      // The panel closes itself once the map is gone
      await deleteOfflineMap(map);
    }
    catch (err) {
      console.error('Error deleting offline map', err);
      alert('Error', `Unable to delete ${getOfflineMapTitle(map)}.`);
    }
  };

  const saveMapName = (values) => {
    dispatch(editedOfflineMap({id: map.id, name: values.name.trim()}));
    closeSidePanel();
  };

  const validateMapName = values => isEmpty(values.name?.trim()) ? {name: 'Name is required'} : {};

  /* Render Functions */

  const renderInfoRow = (label, value) => (
    <ListItem containerStyle={commonStyles.listItemFormField} key={label}>
      <ListItem.Content>
        <View style={formStyles.fieldLabelContainer}>
          <Text style={formStyles.fieldLabel}>{label}</Text>
        </View>
        <Text style={formStyles.fieldValue}>{value}</Text>
      </ListItem.Content>
    </ListItem>
  );

  const renderLocation = () => {
    const [west, south, east, north] = tileStats.bbox;
    return (
      <>
        <SectionDivider dividerText={'Location'}/>
        {renderInfoRow('Center', `${formatCoordinate((north + south) / 2)}, ${formatCoordinate((west + east) / 2)}`)}
        {renderInfoRow('North / South', `${formatCoordinate(north)} / ${formatCoordinate(south)}`)}
        {renderInfoRow('West / East', `${formatCoordinate(west)} / ${formatCoordinate(east)}`)}
      </>
    );
  };

  const renderName = () => {
    if (!isRenameable) return renderInfoRow('Name', getOfflineMapTitle(map));
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <TextInputField isRequired={true} label={'Name'} name={'name'}/>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderTiles = () => (
    <>
      <SectionDivider dividerText={'Tiles'}/>
      {renderInfoRow('Tile Count', map.count === 0 ? 'No tiles downloaded' : map.count.toLocaleString())}
      {tileStats?.size > 0 && renderInfoRow('Size on Device', formatTilesSize(tileStats.size))}
      {!isEmpty(zoomLevels) && renderInfoRow('Zoom Levels', zoomLevels.length === 1 ? `${zoomLevels[0]}`
        : `${zoomLevels[0]} to ${zoomLevels[zoomLevels.length - 1]}`)}
      {!isEmpty(zoomLevels) && renderInfoRow('Tiles per Zoom', zoomLevels
        .map(zoom => `Zoom ${zoom}: ${tileStats.zoomCounts[zoom].toLocaleString()}`).join('\n'))}
    </>
  );

  /* View */

  if (!map) return null;

  return (
    <FormikWrapper
      enableReinitialize={true}
      initialValues={{name: getOfflineMapTitle(map)}}
      setIsFormInvalid={setIsFormInvalid}
      validate={validateMapName}
    >
      {formProps => (
        <View style={{flex: 1}}>
          <SidePanelHeader
            backButton={() => handleBackPress(formProps)}
            headerTitle={'Offline Map Details'}
            title={'Offline Maps'}
          />
          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps={'handled'}
            style={{flex: 1}}
          >
            {renderName()}
            {!!mapTypeName && renderInfoRow('Map Type', mapTypeName)}
            {!!map.date && renderInfoRow('Last Updated', map.date)}
            {renderTiles()}
            {!!tileStats?.bbox && renderLocation()}
          </ScrollView>
          <View style={customMapStyles.bottomButtonsContainer}>
            <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
              <DeleteButton onPress={confirmDeleteMap}/>
              {isRenameable && (
                <ActionButton
                  disabled={isFormInvalid || !formProps.dirty}
                  onPress={() => saveMapName(formProps.values)}
                  title={'Update'}
                />
              )}
            </View>
          </View>
        </View>
      )}
    </FormikWrapper>
  );
};

export default OfflineMapDetails;
