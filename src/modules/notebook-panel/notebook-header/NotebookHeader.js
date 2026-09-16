import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {Button, Image} from '@rn-vui/base';
import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import notebookHeaderStyles from './notebookHeader.styles';
import NotebookMenu from './NotebookMenu';
import {getLatLngText, isEmpty, toFixedInteger, toTitleCase} from '../../../shared/helpers';
import {MEDIUM_TEXT_SIZE, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../../shared/styles.constants';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import IconButton from '../../../shared/ui/buttons/IconButton';
import {LABEL_DICTIONARY} from '../../form/form.constants';
import {openedMessageModal} from '../../home/home.slice';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import {getUtmDisplayString} from '../../maps/maps.helpers';
import useMapLocation from '../../maps/view/useMapLocation';
import {PAGE_KEYS} from '../../page/pageKeys.constants';
import projectStyles from '../../project/project.styles';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import {editedOrCreatedSpot, editedSpotProperties, setSelectedSpot} from '../../spots/spots.slice';
import useSpots from '../../spots/useSpots';
import {TRACE_SUB_TYPE_FIELDS} from '../notebook.constants';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookHeader = ({
                          closeNotebookPanel,
                          createDefaultGeom,
                          isReadOnly,
                          isSampleOrSampleChild,
                          openMainMenuPanel,
                          selectedSample,
                          setSelectedSample,
                          zoomToSpots,
                        }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isUtmDisplay = useSelector(state => state.user.is_utm_display);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const navigation = useNavigation();
  const {getCurrentLocation} = useMapLocation();
  const {
    checkSpotName,
    getReadOnlyReason,
    getRootSpotGeoCoords,
    getSampleSpotIconSource,
    getSpotGeometryIconSource,
    getSpotWithThisImageBasemap,
    getSpotWithThisSample,
    handleSpotSelected,
    isCurrentMapReadOnly,
  } = useSpots();

  /* Local State */

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isNotebookMenuVisible, setIsNotebookMenuVisible] = useState(false);

  /* Derived Variables */

  const isLegacySample = selectedAttributes?.[0]?.sample_id_name;
  const headerTitle = isLegacySample ? selectedAttributes?.[0]?.sample_id_name : spot.properties.name || 'Unknown';
  const spotWithThisImageBasemap = spot.properties?.image_basemap
    && getSpotWithThisImageBasemap(spot.properties.image_basemap);
  const parentSpot = spot.properties?.isSample ? getSpotWithThisSample(spot.properties.id)
    : !isEmpty(spotWithThisImageBasemap) ? spotWithThisImageBasemap
      : null;

  /* Event Handlers */

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

  /* Logic Helpers */

  const getCoordText = (lat, lng) => isUtmDisplay ? getUtmDisplayString([lng, lat]) : getLatLngText(lat, lng);

  // Name the dataset to unlock AND why this Spot is affected by it. Without the reason, someone looking at a
  // Spot in their own open dataset is told to go unlock a dataset that Spot is not even in.
  const getReadOnlyReasonText = () => {
    const reason = getReadOnlyReason(spot);
    if (isEmpty(reason)) return 'Unlock its dataset from the Datasets page.';  // the modal title says the rest
    const {cause, datasetNames} = reason;
    const unlockText = datasetNames.length === 1 ? `Unlock dataset ${datasetNames[0]} from the Datasets page.`
      : `Unlock datasets ${datasetNames.join(', ')} from the Datasets page.`;
    // Any Spot on a section locks it, not only an interval, and a reorder moves everything on the section
    if (cause === 'stratSection') {
      const sectionText = spot.properties?.strat_section_id ? 'Another Spot on this strat section is Read Only'
        : 'This Spot\'s strat section holds a Read Only Spot';
      return `${sectionText}, so the whole section is locked. ${unlockText}`;
    }
    if (cause === 'map') {
      const mapText = spot.properties?.image_basemap ? 'image basemap' : 'strat section';
      return `The ${mapText} this Spot is on belongs to a Read Only Spot. ${unlockText}`;
    }
    return `This Spot is in a Read Only dataset. ${unlockText}`;
  };

  const getSpotCoordText = () => {
    if (spot.geometry && spot.geometry.type) {
      // Creates DMS string for Point coordinates
      if (spot.geometry.type === 'Point') {
        const lng = spot.geometry.coordinates[0];
        const lat = spot.geometry.coordinates[1];
        if (spot.properties.image_basemap || spot.properties.strat_section_id) {
          const pixelDetails = toFixedInteger(lng, 6) + ' X, ' + toFixedInteger(lat, 6) + ' Y';
          // The Spot's own lng/lat when it has them, else wherever its map hangs from - getRootSpotGeoCoords walks
          // that nesting and refuses a holder still on a pixel map, whose own coordinates are pixels too.
          const geoCoords = !isEmpty(spot.properties.lng) && !isEmpty(spot.properties.lat)
            ? [spot.properties.lng, spot.properties.lat]
            : getRootSpotGeoCoords(spot.properties.image_basemap, spot.properties.strat_section_id);
          return geoCoords ? getCoordText(geoCoords[1], geoCoords[0]) + '\n' + pixelDetails : pixelDetails;
        }
        else return getCoordText(lat, lng);
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
    const subType = TRACE_SUB_TYPE_FIELDS.find(subTypeField => spot.properties.trace[subTypeField]);
    if (subType) {
      const subTypeValue = spot.properties.trace[subType];
      const subTypeLabel = traceDictionary[subTypeValue];
      if (subTypeLabel) traceText = traceText + ' - ' + subTypeLabel.toUpperCase();
    }
    return traceText;
  };

  const goBackToParentSpot = () => {
    setSelectedSample({});
    if (!isEmpty(parentSpot)) {
      dispatch(setSelectedSpot(parentSpot));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
  };

  // The reason runs to a couple of sentences and lands while the menu panel is animating in, which is more
  // than a toast's few seconds can carry - so it goes in the message modal, which waits to be dismissed and
  // can be re-read.
  const goToDatasetsPage = () => {
    dispatch(openedMessageModal({message: getReadOnlyReasonText(), title: 'Spot is Read Only'}));
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
    if (openMainMenuPanel) openMainMenuPanel();
  };

  // A GPS reading puts the Spot on the geo map whichever map is on screen. So the properties that only mean something
  // on a pixel map go - a copy inherits them with no geometry to match, see copySpot - and the open map goes with
  // them, which handleSpotSelected does and setSelectedSpot does not.
  const setToCurrentLocation = async () => {
    const currentLocation = await getCurrentLocation();
    let editedSpot = JSON.parse(JSON.stringify(spot));
    editedSpot.geometry = turf.point([currentLocation.longitude, currentLocation.latitude]).geometry;
    delete editedSpot.properties.image_basemap;
    delete editedSpot.properties.lat;
    delete editedSpot.properties.lng;
    delete editedSpot.properties.strat_section_id;
    if (currentLocation.altitude) editedSpot.properties.altitude = currentLocation.altitude;
    if (currentLocation.accuracy) editedSpot.properties.gps_accuracy = currentLocation.accuracy;
    dispatch(updatedModifiedTimestampsBySpotsIds([editedSpot.properties.id]));
    dispatch(editedOrCreatedSpot(editedSpot));
    handleSpotSelected(editedSpot);
  };

  /* Render Functions */

  const renderCoordsText = () => {
    return (
      <View style={{alignSelf: 'flex-start', margin: -10, paddingBottom: 5}}>
        <ClearButton
          onPress={() => !isLegacySample && dispatch(setNotebookPageVisible(PAGE_KEYS.GEOGRAPHY))}
          title={getSpotCoordText()}
          titleProps={{style: {fontSize: MEDIUM_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}}
        />
      </View>
    );
  };

  const renderNotebookHeaderContent = () => {
    return (
      <>
        <View style={{paddingLeft: 10, paddingRight: 5}}>
          <Image
            onPress={() => !isLegacySample && dispatch(setNotebookPageVisible(PAGE_KEYS.METADATA))}
            resizeMode={'contain'}
            source={spot.properties.isSample ? getSampleSpotIconSource() : getSpotGeometryIconSource(spot)}
            style={notebookHeaderStyles.headerImage}
          />
        </View>
        <View
          style={[notebookHeaderStyles.headerSpotNameAndCoordsContainer, isReadOnly && !getSpotCoordText() && {height: 60}]}
        >
          {isEditingTitle && !isReadOnly && !isLegacySample ? (
            <TextInput
              autoFocus
              onBlur={() => {
                if (!spot.properties.name) onSpotEdit('name', 'Unknown');
                setIsEditingTitle(false);
              }}
              onChangeText={text => onSpotEdit('name', text)}
              style={notebookHeaderStyles.headerSpotName}
              textAlign={'left'}
              value={spot.properties.name || ''}
            />
          ) : (
            <Text
              ellipsizeMode={'tail'}
              numberOfLines={1}
              onPress={() => !isReadOnly && !isLegacySample && setIsEditingTitle(true)}
              style={notebookHeaderStyles.headerSpotName}
            >
              {headerTitle}
            </Text>
          )}
          {getSpotCoordText() ? renderCoordsText() : !isReadOnly && !isLegacySample && renderSetCoordsText()}
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
          closeNotebookPanel={closeNotebookPanel}
          isNotebookMenuVisible={isNotebookMenuVisible}
          isReadOnly={isReadOnly}
          isSample={spot.properties.isSample || !isEmpty(selectedSample)}
          overlayStyle={notebookStyles.dialogBoxPosition}
          parentSpot={parentSpot}
          zoomToSpots={zoomToSpots}
        />
      </>
    );
  };

  const renderNotebookSampleHeaderContent = () => {
    return (
      <>
        <View style={{alignItems: 'flex-start', flex: 1}}>
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
          <View style={[{width: '100%'}, isSampleOrSampleChild && notebookHeaderStyles.sampleSideBorders]}>
            {isSampleOrSampleChild && (
              <View style={notebookHeaderStyles.sampleBanner}>
                {spot.properties.isSample && (
                  <Text style={notebookHeaderStyles.sampleBannerText}>
                    {'S      A      M      P      L      E'}
                  </Text>
                )}
              </View>
            )}
            <View style={{alignItems: 'center', flexDirection: 'row'}}>
              {renderNotebookHeaderContent()}
            </View>
          </View>
        </View>
      </>
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
        {/* The geometry is placed on the map on screen, so a read only image basemap or strat section is off limits */}
        {!isCurrentMapReadOnly() && (
          <View style={{alignSelf: 'flex-start', margin: -10, paddingBottom: 5}}>
            <ClearButton
              onPress={() => {
                createDefaultGeom();
                // The geometry goes onto the map, so show it. On a small screen the Notebook is a tab rather than a
                // drawer, and closeNotebookPanel only hides it where it stands, blanking the tab being looked at.
                if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
                else closeNotebookPanel();
              }}
              title={'Set in Current View'}
            />
          </View>
        )}
      </View>
    );
  };

  /* View */

  return (
    <>
      {isSampleOrSampleChild ? renderNotebookSampleHeaderContent() : renderNotebookHeaderContent()}
    </>
  );
};

export default NotebookHeader;

