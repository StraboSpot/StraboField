import React, {useContext, useRef} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import * as turf from '@turf/turf';
import {useDispatch, useSelector} from 'react-redux';

import GeoFieldInputs from './GeoFieldInputs';
import {GEOGRAPHY_FORM_NAME, GEOMETRY_FIELD_LABELS} from './geography.constants';
import {
  getEditedUtmGeometry,
  getGeographyProperties,
  getGeometryErrors,
  getInitialGeomValues,
  getParsedGeomValues,
} from './geography.helpers';
import UtmFieldInputs from './UtmFieldInputs';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import Form from '../form/Form';
import formStyles from '../form/form.styles';
import FormikWrapper from '../form/FormikWrapper';
import NumberInputField from '../form/inputs/NumberInputField';
import TextInputField from '../form/inputs/TextInputField';
import useForm from '../form/useForm';
import useMapView from '../maps/view/useMapView';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {setNotebookPageVisibleToPrev} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot} from '../spots/spots.slice';

const Geography = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isUtmDisplay = useSelector(state => state.user.is_utm_display);
  const spot = useSelector(state => state.spot.selectedSpot);
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {submitAndShowErrors, validateForm} = useForm();
  const {isOnGeoMap} = useMapView();

  const formRef = useRef(null);
  const {isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => `Your changes to ${page.label} haven't been saved.`,
    save: () => saveForm(),
  });

  /* Derived Variables */

  const isSpotOnGeoMap = isOnGeoMap(spot);
  const initialGeomValues = getInitialGeomValues(spot, isSpotOnGeoMap, isUtmDisplay);
  console.log('Rendering Form:', GEOGRAPHY_FORM_NAME.join('.'), 'with', spot.properties);

  /* Logic Helpers */

  const cancelFormAndGo = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    dispatch(setNotebookPageVisibleToPrev());
  };

  // Reports whether the save happened. A refusal has already alerted about the field it stopped on, so a caller
  // stays where it is for that to be fixed rather than carrying on.
  const saveForm = async () => {
    try {
      const {values} = await submitAndShowErrors(formRef.current);
      const editedGeomFormData = getParsedGeomValues(values);
      const geographyProperties = getGeographyProperties(values);
      console.log('Saving form data to Spot ...');
      let geometry = spot.geometry;
      if (isSpotOnGeoMap) {
        const editedUtmGeometry = isUtmDisplay ? getEditedUtmGeometry(editedGeomFormData, spot) : undefined;
        if (editedUtmGeometry) geometry = editedUtmGeometry;
        else if (!isEmpty(editedGeomFormData.longitude) && !isEmpty(editedGeomFormData.latitude)) {
          const point = turf.point([editedGeomFormData.longitude, editedGeomFormData.latitude]);
          geometry = point.geometry;
        }
      }
      else {
        if (!isEmpty(editedGeomFormData.x_pixels) && !isEmpty(editedGeomFormData.y_pixels)) {
          const point = turf.point([editedGeomFormData.x_pixels, editedGeomFormData.y_pixels]);
          geometry = point.geometry;
        }
        if (!isEmpty(editedGeomFormData.longitude) && !isEmpty(editedGeomFormData.latitude)) {
          geographyProperties.lng = editedGeomFormData.longitude;
          geographyProperties.lat = editedGeomFormData.latitude;
        }
      }
      const editedSpot = {geometry: geometry, properties: geographyProperties, type: spot.type};
      dispatch(updatedModifiedTimestampsBySpotsIds([editedSpot.properties.id]));
      dispatch(editedOrCreatedSpot(editedSpot));
      markSaved();
      return true;
    }
    catch (err) {
      console.error('Error submitting form', err);
      return false;
    }
  };

  const saveFormAndGo = async () => {
    if (await saveForm()) {
      console.log('Finished saving form data to Spot');
      dispatch(setNotebookPageVisibleToPrev());
    }
  };

  // The survey checks the Spot's properties, and the geometry fields are checked here
  const validateGeography = values => ({
    ...validateForm({formName: GEOGRAPHY_FORM_NAME, values: values}).errors,
    ...getGeometryErrors(values, isUtmDisplay),
  });

  /* Render Functions */

  const renderGeoCoords = () => {
    if (isEmpty(initialGeomValues.latitude) || isEmpty(initialGeomValues.longitude)) return renderGeoFieldText();
    return isUtmDisplay ? <UtmFieldInputs formRef={formRef} isReadOnly={isReadOnly}/>
      : <GeoFieldInputs formRef={formRef} isReadOnly={isReadOnly}/>;
  };

  const renderGeoFieldText = () => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <TextInputField
            appearance={'multiline'}
            editable={false}
            label={'Coordinates as [Longitude, Latitude]'}
            name={'coordsString'}
          />
        </ListItem.Content>
      </ListItem>
    );
  };

  const renderPixelCoords = () => {
    return (
      <>
        {!isEmpty(initialGeomValues.x_pixels) && !isEmpty(initialGeomValues.y_pixels)
          ? renderPixelFieldInputs() : renderPixelFieldText()}
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <View style={formStyles.fieldLabelContainer}>
              <Text style={formStyles.fieldLabel}>Real-World Coordinates</Text>
            </View>
            {isUtmDisplay && (
              <TextInputField
                editable={false}
                label={GEOMETRY_FIELD_LABELS.utm_zone}
                name={'utm_zone'}
              />
            )}
            <View style={{flex: 1, flexDirection: 'row'}}>
              <View style={{flex: 1, flexDirection: 'row', overflow: 'hidden'}}>
                <View style={{flex: 1, paddingRight: 5}}>
                  <NumberInputField
                    editable={false}
                    label={isUtmDisplay ? GEOMETRY_FIELD_LABELS.easting : GEOMETRY_FIELD_LABELS.longitude}
                    name={isUtmDisplay ? 'easting' : 'longitude'}
                  />
                </View>
                <View style={{flex: 1}}>
                  <NumberInputField
                    editable={false}
                    label={isUtmDisplay ? GEOMETRY_FIELD_LABELS.northing : GEOMETRY_FIELD_LABELS.latitude}
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
                <NumberInputField
                  editable={false}
                  label={GEOMETRY_FIELD_LABELS.x_pixels}
                  name={'x_pixels'}
                />
              </View>
              <View style={{flex: 1}}>
                <NumberInputField
                  editable={false}
                  label={GEOMETRY_FIELD_LABELS.y_pixels}
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
          <TextInputField
            appearance={'multiline'}
            editable={false}
            label={'Coordinates as [X Pixels, Y Pixels]'}
            name={'coordsString'}
          />
        </ListItem.Content>
      </ListItem>
    );
  };

  /* View */

  // One form for the geometry and the Spot's properties, which the save splits apart again
  return (
    <FlatList
      ListHeaderComponent={
        <>
          <PageHeader hideBackButton={!isReadOnly} pageTitle={page.label}/>
          {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} getIsDisabled={isFormInvalid} save={saveFormAndGo}/>}
          <FormikWrapper
            enableReinitialize={true}
            fieldLabels={GEOMETRY_FIELD_LABELS}
            formName={GEOGRAPHY_FORM_NAME}
            initialValues={{...spot.properties, ...initialGeomValues}}
            innerRef={formRef}
            setIsFormDirty={setIsFormDirty}
            setIsFormInvalid={setIsFormInvalid}
            validate={validateGeography}
          >
            {formProps => (
              <View style={{flex: 1}}>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <TextInputField
                      editable={false}
                      label={'Geometry'}
                      name={'geomType'}
                    />
                  </ListItem.Content>
                </ListItem>
                {isSpotOnGeoMap ? renderGeoCoords() : renderPixelCoords()}
                <Form {...formProps} formName={GEOGRAPHY_FORM_NAME} isReadOnly={isReadOnly}/>
              </View>
            )}
          </FormikWrapper>
        </>
      }
    />
  );
};

export default Geography;
