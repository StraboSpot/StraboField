import React, {useState} from 'react';
import {TextInput, View} from 'react-native';

import {Button, Image} from '@rn-vui/base';
import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import notebookHeaderStyles from './notebookHeader.styles';
import NotebookMenu from './NotebookMenu';
import {isEmpty, toTitleCase} from '../../../shared/Helpers';
import {PRIMARY_TEXT_COLOR, SMALL_TEXT_SIZE} from '../../../shared/styles.constants';
import IconButton from '../../../shared/ui/IconButton';
import {LABEL_DICTIONARY} from '../../form';
import useMapLocation from '../../maps/useMapLocation';
import {PAGE_KEYS} from '../../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../../project/projects.slice';
import {useSpots} from '../../spots';
import {editedOrCreatedSpot, editedSpotProperties, setSelectedSpot} from '../../spots/spots.slice';
import {setNotebookPageVisible} from '../notebook.slice';
import notebookStyles from '../notebook.styles';

const NotebookHeader = ({closeNotebookPanel, createDefaultGeom, zoomToSpots}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isNotebookMenuVisible, setIsNotebookMenuVisible] = useState(false);

  const {checkSpotName, getRootSpot, getSpotGeometryIconSource, getSpotWithThisStratSection} = useSpots();
  const {getCurrentLocation} = useMapLocation();

  const getSpotCoordText = () => {
    if (spot.geometry && spot.geometry.type) {
      // Creates DMS string for Point coordinates
      if (spot.geometry.type === 'Point') {
        let lng = spot.geometry.coordinates[0];
        let lat = spot.geometry.coordinates[1];
        if (spot.properties.image_basemap || spot.properties.strat_section_id) {
          let pixelDetails = toFixedIfNecessary(lng, 6) + ' X, ' + toFixedIfNecessary(lat, 6) + ' Y';
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

  const getLatLngText = (lat, lng) => {
    const degreeSymbol = '\u00B0';
    let latitudeCardinal = Math.sign(lat) >= 0 ? 'N' : 'S';
    let longitudeCardinal = Math.sign(lng) >= 0 ? 'E' : 'W';
    return toFixedIfNecessary(lng, 6) + degreeSymbol + ' ' + longitudeCardinal + ', '
      + toFixedIfNecessary(lat, 6) + degreeSymbol + ' ' + latitudeCardinal;
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

  const onSpotEdit = async (field, value) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: field, value: value}));
    await checkSpotName(value);
  };

  const renderCoordsText = () => {
    return (
      <Button
        type={'clear'}
        title={getSpotCoordText()}
        titleStyle={{textAlign: 'left', color: PRIMARY_TEXT_COLOR}}
        buttonStyle={{padding: 0, justifyContent: 'flex-start'}}
        onPress={() => dispatch(setNotebookPageVisible(PAGE_KEYS.GEOGRAPHY))}
      />
    );
  };

  const renderSetCoordsText = () => {
    return (
      <View style={{flexDirection: 'row'}}>
        {!spot.properties.trace && !spot.properties.surface_feature && (
          <Button
            type={'clear'}
            title={'Set To Current Location'}
            titleStyle={{fontSize: SMALL_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}
            buttonStyle={{padding: 0, paddingRight: 15}}
            onPress={setToCurrentLocation}
          />
        )}
        <Button
          type={'clear'}
          title={'Set in Current View'}
          titleStyle={{fontSize: SMALL_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}
          buttonStyle={{padding: 0}}
          onPress={() => {
            createDefaultGeom();
            closeNotebookPanel();
          }}
        />
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

  const toFixedIfNecessary = (value, dp) => {
    return +parseFloat(value).toFixed(dp);
  };

  return (
    <>
      <Image
        source={getSpotGeometryIconSource(spot)}
        style={notebookHeaderStyles.headerImage}
        onPress={() => dispatch(setNotebookPageVisible(PAGE_KEYS.METADATA))}
        resizeMode={'contain'}
      />
      <View style={notebookHeaderStyles.headerSpotNameAndCoordsContainer}>
        <TextInput
          value={spot.properties.name || ''}
          onChangeText={text => onSpotEdit('name', text)}
          style={notebookHeaderStyles.headerSpotName}
        />
        {getSpotCoordText() ? renderCoordsText() : renderSetCoordsText()}
      </View>
      <View>
        <IconButton
          onPress={() => setIsNotebookMenuVisible(prevState => !prevState)}
          source={require('../../../assets/icons/MapActions.png')}
          style={notebookHeaderStyles.threeDotMenu}
        />
      </View>
      <NotebookMenu
        closeNotebookMenu={() => setIsNotebookMenuVisible(false)}
        isNotebookMenuVisible={isNotebookMenuVisible}
        overlayStyle={notebookStyles.dialogBoxPosition}
        zoomToSpots={zoomToSpots}
      />
    </>
  );
};

export default NotebookHeader;

