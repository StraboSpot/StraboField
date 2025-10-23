import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, Text, TextInput, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {formStyles, SelectInputField, TextInputField, useForm} from '../form';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import {DEFAULT_GEOLOGIC_TYPES} from '../project/project.constants';
import {addedCustomFeatureTypes, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';
import {useTags} from '../tags';

const OtherFeatureDetail = ({
                              featureTypes,
                              hideFeatureDetail,
                              isReadOnly,
                              selectedFeature,
                            }) => {
  const dispatch = useDispatch();
  const {showErrors} = useForm();
  const {deleteFeatureTags} = useTags();
  const spot = useSelector(state => state.spot.selectedSpot);
  const projectFeatures = useSelector(state => state.project.project?.other_features);

  const customFeatureTypes = projectFeatures.filter(feature => !DEFAULT_GEOLOGIC_TYPES.includes(feature));
  let [otherType, setOtherType] = useState(undefined);
  const formRef = useRef(null);

  useLayoutEffect(() => {
    console.log('ULE OtherFeatureDetail []');
    return () => confirmLeavePage();
  }, []);

  const cancelForm = async () => {
    hideFeatureDetail();
  };

  const confirmLeavePage = () => {
    if (formRef.current && formRef.current.dirty) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => saveForm(formCurrent),
          },
        ],
        {cancelable: false},
      );
    }
  };

  const deleteFeature = () => {
    let otherFeatures = spot.properties.other_features;
    let existingFeature = otherFeatures.filter(feature => feature.id === selectedFeature.id);
    if (!isEmpty(existingFeature)) {
      delete existingFeature[0];
      deleteFeatureTags([selectedFeature]);
      otherFeatures = otherFeatures.filter(feature => feature.id !== selectedFeature.id);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'other_features', value: otherFeatures}));
    }
    hideFeatureDetail();
  };

  const deleteFeatureConfirm = () => {
    alert('Delete Feature',
      'Are you sure you would like to delete this feature?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => deleteFeature(),
        },
      ],
      {cancelable: false},
    );
  };

  const renderForm = () => {
    // Validate the feature
    const validateFeature = (values) => {
      let errors = {};
      if (isEmpty(values.name)) errors.name = 'Feature name cannot be empty';
      if (!values.type || isEmpty(values.type)) errors.type = 'Feature type cannot be empty';
      return errors;
    };

    const initialFeatureValues = {
      label: selectedFeature.label,
      name: selectedFeature.name,
      type: selectedFeature.type,
      description: selectedFeature.description,
    };

    return (
      <View style={{flex: 1}}>
        <Formik
          enableReinitialize={true}
          initialValues={initialFeatureValues}
          innerRef={formRef}
          onSubmit={values => console.log('Submitting form...', values)}
          validate={validateFeature}
        >
          {() => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={TextInputField}
                    key={'label'}
                    label={'Label'}
                    name={'label'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={TextInputField}
                    key={'name'}
                    label={'Name'}
                    name={'name'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    choices={featureTypes.map(featureType => ({label: featureType, value: featureType}))}
                    component={formProps => (
                      SelectInputField({setFieldValue: formProps.form.setFieldValue, ...formProps.field, ...formProps})
                    )}
                    key={'type'}
                    label={'Feature Type'}
                    name={'type'}
                    single={true}
                  />
                </ListItem.Content>
              </ListItem>
              {formRef.current && formRef.current.values.type === 'other' && (
                <>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <View style={formStyles.fieldLabelContainer}>
                        <Text style={formStyles.fieldLabel}>{'Other Feature Type'}</Text>
                      </View>
                      <TextInput
                        onChangeText={newType => setOtherType(newType)}
                        placeholder={'Type of feature ...'}
                        placeholderTextColor={themes.MEDIUMGREY}
                        style={formStyles.fieldValue}
                        value={otherType || ''}
                      />
                    </ListItem.Content>
                  </ListItem>
                </>
              )}
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    appearance={'multiline'}
                    component={TextInputField}
                    key={'description'}
                    label={'Feature Description'}
                    name={'description'}
                  />
                </ListItem.Content>
              </ListItem>
              {!isReadOnly && Object.keys(selectedFeature).length > 1 && (
                <DeleteButton onPress={() => deleteFeatureConfirm()} title={'Delete Feature'}/>
              )}
            </View>
          )}
        </Formik>
      </View>
    );
  };

  const saveForm = async (formCurrent) => {
    try {
      await formCurrent.submitForm();
      let formValues = showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
      let featureToEdit;
      let otherFeatures = spot.properties.other_features;
      if (otherFeatures && otherFeatures.length > 0) {
        let existingFeatures = otherFeatures.filter(feature => feature.id === selectedFeature.id);
        if (!isEmpty(existingFeatures)) {
          otherFeatures = otherFeatures.filter(feature => feature.id !== selectedFeature.id);
          featureToEdit = JSON.parse(JSON.stringify(existingFeatures[0]));
        }
        else {
          otherFeatures = JSON.parse(JSON.stringify(otherFeatures));
          featureToEdit = selectedFeature;
        }
      }
      else {
        otherFeatures = [];
        featureToEdit = selectedFeature;
      }
      if (updateFeature(featureToEdit, otherFeatures, formValues)) {
        await formRef.current.resetForm();
        hideFeatureDetail();
      }
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  const updateFeature = (feature, otherFeatures, formValues) => {
    feature.label = formValues.label || formValues.name;
    feature.name = formValues.name;
    if (formValues.type === 'other') {
      if (validateAndSetNewType(otherType)) {
        feature.type = otherType;
        //let index = projectFeatures[projectFeatures.length - 1].id + 1;
        let name = otherType;
        let projectFeaturesCopy = JSON.parse(JSON.stringify(projectFeatures));
        projectFeaturesCopy.push(name);
        dispatch(addedCustomFeatureTypes(projectFeaturesCopy));
      }
      else return false;
    }
    else feature.type = formValues.type;
    feature.description = formValues.description;
    otherFeatures.push(feature);
    const spotId = spot.properties.id;
    dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
    dispatch(editedSpotProperties({field: 'other_features', value: otherFeatures, spotId: spotId}));
    return true;
  };

  const validateAndSetNewType = (newType) => {
    let existingCustomFeatureTypes = customFeatureTypes.filter(feature => feature === newType);
    if (!isEmpty(existingCustomFeatureTypes)) {
      alert('Alert!',
        'The type ' + newType + ' is already being used. Choose a different type name.');
      setOtherType('');
      return false;
    }
    else if (isEmpty(otherType)) {
      alert('Alert!', 'The new type being defined is empty');
      return false;
    }
    else return true;
  };

  return (
    <>
      <NotebookPageHeader hideBackButton={!isReadOnly} onPressBack={cancelForm} pageTitle={'Other Feature Detail'}/>
      {!isReadOnly && (
        <SaveAndCancelButtons
          cancel={cancelForm}
          save={() => saveForm(formRef.current)}
        />
      )}
      <FlatList ListHeaderComponent={renderForm()}/>
    </>
  );
};

export default OtherFeatureDetail;
