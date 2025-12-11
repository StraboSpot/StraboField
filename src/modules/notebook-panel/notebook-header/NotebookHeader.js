import React, {useState} from 'react';
import {TextInput, View} from 'react-native';

import {Button, Image} from '@rn-vui/base';
import * as turf from '@turf/turf';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import notebookHeaderStyles from './notebookHeader.styles';
import NotebookMenu from './NotebookMenu';
import {getLatLngText, isEmpty, toFixedInteger, toTitleCase} from '../../../shared/Helpers';
import {MEDIUM_TEXT_SIZE, PRIMARY_TEXT_COLOR} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {LABEL_DICTIONARY} from '../../form';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import useMapLocation from '../../maps/useMapLocation';
import {PAGE_KEYS} from '../../page/page.constants';
import projectStyles from '../../project/project.styles';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import {useSpots} from '../../spots';
import {editedOrCreatedSpot, editedSpotProperties, setSelectedSpot} from '../../spots/spots.slice';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookHeader = ({
                          closeNotebookPanel,
                          createDefaultGeom,
                          isReadOnly,
                          openMainMenuPanel,
                          selectedSample,
                          setSelectedSample,
                          zoomToSpots,
                        }) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isNotebookMenuVisible, setIsNotebookMenuVisible] = useState(false);

  const {
    checkSpotName,
    getRootSpot,
    getSampleSpotGeometryIconSource,
    getSpotGeometryIconSource,
    getSpotWithThisSample,
    getSpotWithThisStratSection,
  } = useSpots();
  const {getCurrentLocation} = useMapLocation();
  const toast = useToast();


  const isSample = !isEmpty(selectedSample) || spot.properties.isSample;

  const getParentSpotName = () => {
    const parentSpot = getSpotWithThisSample(spot.properties.id);
    return parentSpot.properties.name;
  };

  const getSpotCoordText = () => {
    if (spot.geometry && spot.geometry.type) {
      // Creates DMS string for Point coordinates
      if (spot.geometry.type === 'Point') {
        let lng = spot.geometry.coordinates[0];
        let lat = spot.geometry.coordinates[1];
        if (spot.properties.image_basemap || spot.properties.strat_section_id) {
          let pixelDetails = toFixedInteger(lng, 6) + ' X, ' + toFixedInteger(lat, 6) + ' Y';
          if (isEmpty(spot.properties.lat) || isEmpty(spot.properties.lng)) {
            const rootSpot = spot.properties.image_basemap ? getRootSpot(spot.properties.image_basemap)
              : getSpotWithThisStratSection(spot.properties.strat_section_id);
            if (rootSpot && rootSpot.geometry && rootSpot.geometry.type === 'Point') {
              lng = rootSpot.geometry.coordinates[0];
              lat = rootSpot.geometry.coordinates[1];
              return getLatLngText(lat, lng) + '\n' + pixelDetails;
            }
          }
          else {
            lng = spot.properties.lng;
            lat = spot.properties.lat;
            return getLatLngText(lat, lng) + '\n' + pixelDetails;
          }
          return pixelDetails;
        }
        else return getLatLngText(lat, lng);
      }
      else if ((spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
        && spot.properties.trace && spot.properties.trace.trace_feature && spot.properties.trace.trace_type) {
        return getTraceText();
      }
      else if ((spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon'
          || spot.geometry.type === 'GeometryCollection') && spot.properties.surface_feature
        && spot.properties.surface_feature.surface_feature_type) {
        return getSurfaceFeatureText();
      }
      return spot.geometry.type;
    }
    else return undefined;
  };

  const getSurfaceFeatureText = () => {
    const surfaceFeatureDictionary = LABEL_DICTIONARY.general.surface_feature;
    const key = spot.properties.surface_feature.surface_feature_type;
    let surfaceFeatureText = surfaceFeatureDictionary[key] || key.replace(/_/g, ' ');
    if (spot.properties.surface_feature.surface_feature_type === 'other'
      && spot.properties.surface_feature.other_surface_feature_type) {
      surfaceFeatureText = spot.properties.surface_feature.other_surface_feature_type;
    }
    return toTitleCase(surfaceFeatureText);
  };

  const getTraceText = () => {
    const traceDictionary = LABEL_DICTIONARY.general.trace;
    const key = spot.properties.trace.trace_type;
    let traceText = traceDictionary[key] || key.replace(/_/g, ' ');
    traceText = toTitleCase(traceText) + ' Trace';
    const traceSubTypeFields = ['contact_type', 'geologic_structure_type', 'geomorphic_feature', 'antropogenic_feature', 'other_feature'];
    const subType = traceSubTypeFields.find(subTypeField => spot.properties.trace[subTypeField]);
    if (subType) {
      const subTypeValue = spot.properties.trace[subType];
      const subTypeLabel = traceDictionary[subTypeValue];
      if (subTypeLabel) traceText = traceText + ' - ' + subTypeLabel.toUpperCase();
    }
    return traceText;
  };

  const goBackToParentSpot = () => {
    setSelectedSample({});
    const parentSpot = getSpotWithThisSample(spot.properties.id);
    if (spot.properties.isSample && !isEmpty(parentSpot)) {
      dispatch(setSelectedSpot(parentSpot));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
  };

  const goToDatasetsPage = () => {
    toast.show('Spot is in a Read Only Dataset. Unlock this dataset from the Datasets page.',
      {duration: 4000, placement: 'top', type: 'warning'});
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
    if (openMainMenuPanel) openMainMenuPanel();
  };

  const onSpotEdit = async (field, value) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: field, value: value}));
    if (spot.properties?.isSample) {
      const sampleMetadataCopy = isEmpty(spot.properties?.samples?.[0]) ? {id: spot.properties.id}
        : JSON.parse(JSON.stringify(spot.properties.samples[0]));
      sampleMetadataCopy.sample_id_name = value;
      dispatch(editedSpotProperties({field: PAGE_KEYS.SAMPLES, value: [sampleMetadataCopy]}));
    }
    await checkSpotName(value);
  };

  const renderCoordsText = () => {
    return (
      <View style={{alignSelf: 'flex-start', margin: -10, paddingBottom: 5}}>
        <ClearButton
          onPress={() => dispatch(setNotebookPageVisible(PAGE_KEYS.GEOGRAPHY))}
          title={getSpotCoordText()}
          titleProps={{style: {fontSize: MEDIUM_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}}
        />
      </View>
    );
  };

  const renderSetCoordsText = () => {
    return (
      <View style={{flexDirection: 'row'}}>
        {!spot.properties.trace && !spot.properties.surface_feature && (
          <View style={{alignSelf: 'flex-start', margin: -10, paddingBottom: 5, paddingRight: 15}}>
            <ClearButton
              onPress={setToCurrentLocation}
              title={'Set To Current Location'}
            />
          </View>
        )}
        <View style={{alignSelf: 'flex-start', margin: -10, paddingBottom: 5}}>
          <ClearButton
            onPress={() => {
              createDefaultGeom();
              closeNotebookPanel();
            }}
            title={'Set in Current View'}
          />
        </View>
      </View>
    );
  };

  const setToCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    let editedSpot = JSON.parse(JSON.stringify(spot));
    editedSpot.geometry = turf.point([currentLocation.longitude, currentLocation.latitude]).geometry;
    if (currentLocation.altitude) editedSpot.properties.altitude = currentLocation.altitude;
    if (currentLocation.accuracy) editedSpot.properties.gps_accuracy = currentLocation.accuracy;
    dispatch(updatedModifiedTimestampsBySpotsIds([editedSpot.properties.id]));
    dispatch(editedOrCreatedSpot(editedSpot));
    dispatch(setSelectedSpot(editedSpot));
  };

  const renderNotebookHeaderContent = () => {
    return (
      <>
        <Image
          onPress={() => dispatch(setNotebookPageVisible(PAGE_KEYS.METADATA))}
          resizeMode={'contain'}
          source={isSample ? getSampleSpotGeometryIconSource(spot) : getSpotGeometryIconSource(spot)}
          style={notebookHeaderStyles.headerImage}
        />
        <View
          style={[notebookHeaderStyles.headerSpotNameAndCoordsContainer, isReadOnly && !getSpotCoordText() && {height: 60}]}
        >
          <TextInput
            editable={!isReadOnly}
            onChangeText={text => onSpotEdit('name', text)}
            style={notebookHeaderStyles.headerSpotName}
            textAlign={'left'}
            value={spot.properties.name || 'Unknown'}
          />
          {getSpotCoordText() ? renderCoordsText() : !isReadOnly && renderSetCoordsText()}
        </View>
        <View style={{flexDirection: 'row'}}>
          {isReadOnly && (
            <Button
              buttonStyle={{
                backgroundColor: 'transparent',
                paddingVertical: 0,
                paddingHorizontal: 2,
                height: 50,
                width: 40,
              }}
              icon={{type: 'ionicon', name: 'lock-closed'}}
              onPress={goToDatasetsPage}
            />
          )}
          <IconButton
            onPress={() => setIsNotebookMenuVisible(prevState => !prevState)}
            source={require('../../../assets/icons/MapActions.png')}
            style={notebookHeaderStyles.threeDotMenu}
          />
        </View>
        <NotebookMenu
          closeNotebookMenu={() => setIsNotebookMenuVisible(false)}
          isNotebookMenuVisible={isNotebookMenuVisible}
          isReadOnly={isReadOnly}
          isSample={isSample}
          overlayStyle={notebookStyles.dialogBoxPosition}
          zoomToSpots={zoomToSpots}
        />
      </>
    );
  };

  const renderNotebookSampleHeaderContent = () => {
    return (
      <>
        <View style={{alignItems: 'flex-start', flex: 1, flexDirection: 'column'}}>
          <View style={{marginLeft: -10}}>
            <ClearButton
              icon={{
                iconStyle: projectStyles.buttons,
                name: 'arrow-back',
                size: 20,
                type: 'ionicon',
              }}
              onPress={goBackToParentSpot}
              title={parentSpot?.properties?.name || spot.properties.name || ''}
            />
          </View>
          <View style={{alignItems: 'center', flexDirection: 'row'}}>
            {renderNotebookHeaderContent()}
          </View>
        </View>
      </>
    );
  };

  return (
    <>
      {isSample ? renderNotebookSampleHeaderContent() : renderNotebookHeaderContent()}
    </>
  );
};

export default NotebookHeader;

