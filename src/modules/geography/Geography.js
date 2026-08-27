import React, {useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import * as turf from '@turf/turf';
import {Field} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import GeoFieldInputs from './GeoFieldInputs';
import {GEOGRAPHY_FORM_NAME} from './geography.constants';
import UtmFieldInputs from './UtmFieldInputs';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, FormikWrapper, formStyles, NumberInputField, TextInputField, useForm} from '../form';
import {UTM_MAX_LATITUDE, UTM_MIN_LATITUDE} from '../maps/maps.constants';
import {convertLatLngToUtm, convertUtmToLatLng, parseUtmZone} from '../maps/maps.helpers';
import useMapView from '../maps/view/useMapView';
import {setNotebookPageVisibleToPrev} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot} from '../spots/spots.slice';

const Geography = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isUtmDisplay = useSelector(state => state.user.is_utm_display);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {submitAndShowErrors} = useForm();
  const {isOnGeoMap} = useMapView();

  /* Local State */

  const formRef = useRef(null);
  const geomFormRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Logic Helpers */

  const cancelFormAndGo = () => {
    dispatch(setNotebookPageVisibleToPrev());
  };

  // Geometry from the UTM inputs, or undefined if they are incomplete or unchanged. Re-deriving the point when the
  // user did not touch the inputs would nudge the stored WGS84 coordinate by a fraction of a meter on every save.
  const getEditedUtmGeometry = ({easting, northing, utm_zone: zone}) => {
    const parsedZone = parseUtmZone(zone);
    if (isEmpty(easting) || isEmpty(northing) || !parsedZone) return undefined;
    // Compare against the canonical zone label so '13 n' is not mistaken for an edit of '13N'
    const canonicalZone = `${parsedZone.zoneNumber}${parsedZone.isNorthernHemisphere ? 'N' : 'S'}`;
    if (turf.getType(spot) === 'Point') {
      const currentUtm = convertLatLngToUtm(turf.getCoord(spot));
      if (currentUtm.easting === Number(easting) && currentUtm.northing === Number(northing)
        && currentUtm.zone === canonicalZone) return undefined;
    }
    return turf.point(convertUtmToLatLng(easting, northing, zone)).geometry;
  };

  // The geometry fields are typed as text, so read the numbers out of them here rather than having validation
  // write them back into the form as it is typed in. turf needs numbers to build a point from them.
  const getParsedGeomValues = (values) => {
    return ['easting', 'latitude', 'longitude', 'northing', 'x_pixels', 'y_pixels'].reduce(
      (acc, key) => (isEmpty(values[key]) ? acc : {...acc, [key]: parseFloat(values[key])}), {...values});
  };

  const saveForm = async () => {
    try {
      const {values: geomFormValues} = await submitAndShowErrors(geomFormRef.current);
      const editedGeomFormData = getParsedGeomValues(geomFormValues);
      let {values: geographyProperties} = await submitAndShowErrors(formRef.current);
      console.log('Saving form data to Spot ...');
      let geometry = spot.geometry;
      if (isOnGeoMap(spot)) {
        const editedUtmGeometry = isUtmDisplay ? getEditedUtmGeometry(editedGeomFormData) : undefined;
        if (editedUtmGeometry) geometry = editedUtmGeometry;
        else if (!isEmpty(editedGeomFormData.longitude) && !isEmpty(editedGeomFormData.latitude)) {
          const point = turf.point([editedGeomFormData.longitude, editedGeomFormData.latitude]);
          geometry = point.geometry;
        }
      }
      else if (!isOnGeoMap(spot)) {
        if (!isEmpty(editedGeomFormData.x_pixels) && !isEmpty(editedGeomFormData.y_pixels)) {
          const point = turf.point([editedGeomFormData.x_pixels, editedGeomFormData.y_pixels]);
          geometry = point.geometry;
        }
        if (!isEmpty(editedGeomFormData.longitude) && !isEmpty(editedGeomFormData.latitude)) {
          geographyProperties.lng = editedGeomFormData.longitude;
          geographyProperties.lat = editedGeomFormData.latitude;
        }
      }
      const editedSpot = {geometry: geometry, properties: {...geographyProperties}, type: spot.type};
      dispatch(updatedModifiedTimestampsBySpotsIds([editedSpot.properties.id]));
      dispatch(editedOrCreatedSpot(editedSpot));
      return Promise.resolve();
    }
    catch (err) {
      console.error('Error submitting form', err);
      return Promise.reject();
    }
  };

  const saveFormAndGo = () => {
    saveForm().then(() => {
      console.log('Finished saving form data to Spot');
      dispatch(setNotebookPageVisibleToPrev());
    }, () => {
      console.error('Error saving form data to Spot');
    });
  };

  /* Render Functions */

  const renderFormFields = () => {
    const formName = GEOGRAPHY_FORM_NAME;
    console.log('Rendering Form:', formName[0] + '.' + formName[1], 'with', spot.properties);
    return (
      <View style={{flex: 1}}>
        <FormikWrapper
          enableReinitialize={true}
          formName={formName}
          initialValues={spot.properties}
          innerRef={formRef}
        >
          {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
        </FormikWrapper>
      </View>
    );
  };

  const renderGeoCoords = (initialGeomValues) => {
    return (
      <>
        {!isEmpty(initialGeomValues.latitude) && !isEmpty(initialGeomValues.longitude)
          ? (isUtmDisplay
            ? <UtmFieldInputs formRef={formRef} geomFormRef={geomFormRef} isReadOnly={isReadOnly}/>
            : <GeoFieldInputs formRef={formRef} geomFormRef={geomFormRef} isReadOnly={isReadOnly}/>)
          : renderGeoFieldText(initialGeomValues)
        }
      </>
    );
  };

  const renderGeoFieldText = () => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <Field
            appearance={'multiline'}
            component={TextInputField}
            editable={false}
            key={'coordsString'}
            label={'Coordinates as [Longitude, Latitude]'}
            name={'coordsString'}
          />
        </ListItem.Content>
      </ListItem>
    );
  };

  // Render the form for the Geometry
  const renderGeometryForm = () => {
    // Get the array of coordinates as a string
    const getCoordArray = () => {
      if (spot.geometry.coordinates) {
        const coordString = JSON.stringify(spot.geometry.coordinates);
        return '[' + coordString.replace(/^\[+|\]+$/g, '') + ']';         // Remove extra [ and ] from start and end
      }
      else return '[multiple geometries]';
    };

    // Validate the geometry. The fields are left as they were typed - getParsedGeomValues reads the numbers out of
    // them for the save - so that validating a change does not rewrite the field being typed in.
    const validateGeometry = (values) => {
      const {easting, latitude, longitude, northing} = getParsedGeomValues(values);
      let errors = {};
      if (values.latitude && (latitude < -90 || latitude > 90)) {
        errors.latitude = 'Latitude must be between -90 and 90';
      }
      if (values.longitude && (longitude < -180 || longitude > 180)) {
        errors.longitude = 'Longitude must be between -180 and 180';
      }
      if (isUtmDisplay) {
        if (!isEmpty(values.utm_zone) && !parseUtmZone(values.utm_zone)) {
          errors.utm_zone = 'Zone must be 1-60 followed by N or S (e.g. 13N)';
        }
        if (values.easting && (easting < 100000 || easting > 999999)) {
          errors.easting = 'Easting must be between 100,000 and 999,999';
        }
        if (values.northing && (northing < 0 || northing > 10000000)) {
          errors.northing = 'Northing must be between 0 and 10,000,000';
        }
        // An easting/northing inside the numeric bounds above can still convert to a latitude beyond the range UTM
        // is defined for, which would drop the Spot near a pole. Check the converted point rather than the inputs.
        if (isEmpty(errors) && !isEmpty(values.utm_zone) && values.easting && values.northing) {
          const utmLatLng = convertUtmToLatLng(easting, northing, values.utm_zone);
          if (utmLatLng && (utmLatLng[1] < UTM_MIN_LATITUDE || utmLatLng[1] > UTM_MAX_LATITUDE)) {
            errors.northing = `Coordinate is outside the UTM limits of ${Math.abs(UTM_MIN_LATITUDE)}°S `
              + `to ${UTM_MAX_LATITUDE}°N`;
          }
        }
      }
      return errors;
    };

    const initialGeomValues = {
      geomType: turf.getType(spot) ? turf.getType(spot) : '',
      coordsString: getCoordArray(),
    };

    if (isOnGeoMap(spot)) {
      if (turf.getType(spot) === 'Point') {
        initialGeomValues.longitude = turf.getCoord(spot)[0];
        initialGeomValues.latitude = turf.getCoord(spot)[1];
      }
    }
    else {
      if (turf.getType(spot) === 'Point') {
        initialGeomValues.x_pixels = turf.getCoord(spot)[0];
        initialGeomValues.y_pixels = turf.getCoord(spot)[1];
      }
      if (!isEmpty(spot.properties.lng)) initialGeomValues.longitude = spot.properties.lng;
      if (!isEmpty(spot.properties.lat)) initialGeomValues.latitude = spot.properties.lat;
    }

    if (isUtmDisplay && !isEmpty(initialGeomValues.longitude) && !isEmpty(initialGeomValues.latitude)) {
      const {easting, northing, zone} = convertLatLngToUtm(
        [initialGeomValues.longitude, initialGeomValues.latitude]);
      initialGeomValues.easting = easting;
      initialGeomValues.northing = northing;
      initialGeomValues.utm_zone = zone;
    }

    return (
      <FormikWrapper
        enableReinitialize={true}
        initialValues={initialGeomValues}
        innerRef={geomFormRef}
        setIsFormInvalid={setIsFormInvalid}
        validate={validateGeometry}
      >
        {() => (
          <View>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={TextInputField}
                  editable={false}
                  key={'geomType'}
                  label={'Geometry'}
                  name={'geomType'}
                />
              </ListItem.Content>
            </ListItem>
            {isOnGeoMap(spot) ? renderGeoCoords(initialGeomValues) : renderPixelCoords(initialGeomValues)}
          </View>
        )}
      </FormikWrapper>
    );
  };

  const renderPixelCoords = (initialGeomValues) => {
    return (
      <>
        {!isEmpty(initialGeomValues.x_pixels) && !isEmpty(initialGeomValues.y_pixels)
          ? renderPixelFieldInputs() : renderPixelFieldText(initialGeomValues)}
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <View style={formStyles.fieldLabelContainer}>
              <Text style={formStyles.fieldLabel}>Real-World Coordinates</Text>
            </View>
            {isUtmDisplay && (
              <Field
                component={TextInputField}
                editable={false}
                key={'utm_zone'}
                label={'UTM Zone'}
                name={'utm_zone'}
              />
            )}
            <View style={{flex: 1, flexDirection: 'row'}}>
              <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
                <View style={{flex: 1, paddingRight: 5}}>
                  <Field
                    component={NumberInputField}
                    editable={false}
                    key={isUtmDisplay ? 'easting' : 'longitude'}
                    label={isUtmDisplay ? 'Easting (m)' : 'Longitude'}
                    name={isUtmDisplay ? 'easting' : 'longitude'}
                  />
                </View>
                <View style={{flex: 1}}>
                  <Field
                    component={NumberInputField}
                    editable={false}
                    key={isUtmDisplay ? 'northing' : 'latitude'}
                    label={isUtmDisplay ? 'Northing (m)' : 'Latitude'}
                    name={isUtmDisplay ? 'northing' : 'latitude'}
                  />
                </View>
              </View>
            </View>
          </ListItem.Content>
        </ListItem>
      </>
    );
  };

  const renderPixelFieldInputs = () => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <View style={formStyles.fieldLabelContainer}>
            <Text style={formStyles.fieldLabel}>Image Basemap Coordinates</Text>
          </View>
          <View style={{flex: 1, flexDirection: 'row'}}>
            <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
              <View style={{flex: 1, paddingRight: 5}}>
                <Field
                  component={NumberInputField}
                  editable={false}
                  key={'x_pixels'}
                  label={'X Pixels'}
                  name={'x_pixels'}
                />
              </View>
              <View style={{flex: 1}}>
                <Field
                  component={NumberInputField}
                  editable={false}
                  key={'y_pixels'}
                  label={'Y Pixels'}
                  name={'y_pixels'}
                />
              </View>
            </View>
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderPixelFieldText = () => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <Field
            appearance={'multiline'}
            component={TextInputField}
            editable={false}
            key={'coordsString'}
            label={'Coordinates as [X Pixels, Y Pixels]'}
            name={'coordsString'}
          />
        </ListItem.Content>
      </ListItem>
    );
  };

  /* View */

  return (
    <>
      <FlatList
        ListHeaderComponent={
          <>
            <PageHeader hideBackButton={!isReadOnly} pageTitle={page.label}/>
            {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} getIsDisabled={isFormInvalid} save={saveFormAndGo}/>}
            {renderGeometryForm()}
            {renderFormFields()}
          </>
        }
      />
    </>
  );
};

export default Geography;
