import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {FormikWrapper, SelectInputField, TextInputField, useForm} from '../form';
import PageHeader from '../page/PageHeader';
import {addedCustomFeatureTypes, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';
import {useTags} from '../tags';

const OtherFeatureDetail = ({
                              featureTypes,
                              hideFeatureDetail,
                              isReadOnly,
                              page,
                              selectedFeature,
                            }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const projectFeatures = useSelector(state => state.project.project?.other_features);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {submitAndShowErrors} = useForm();
  const {deleteFeatureTags} = useTags();

  /* Local State */

  const formRef = useRef(null);
  // The values already saved, so leaving straight afterwards does not ask about them again. The form's own
  // dirty flag is not enough on its own: the page can unmount in the same render pass as the save, leaving
  // this ref holding the form as it was before it.
  const savedValuesRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE OtherFeatureDetail []');
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const cancelForm = async () => {
    hideFeatureDetail();
  };

  const confirmLeavePage = () => {
    if (formRef.current?.dirty && !isEqual(formRef.current.values, savedValuesRef.current)) {
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
            onPress: () => saveForm(formCurrent, true),
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

  // Whether the page is being left is the caller's to say, rather than read back off a ref that may not have
  // been cleared yet - guessing it wrong refuses an edit whole that was meant to keep all but its bad field
  const saveForm = async (formCurrent, isLeavingPage) => {
    try {
      let {values: formValues} = await submitAndShowErrors(formRef.current || formCurrent, isLeavingPage);
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
        savedValuesRef.current = {...formRef.current.values};
        await formRef.current.resetForm();
        hideFeatureDetail();
      }
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  const updateFeature = (feature, otherFeatures, formValues) => {
    feature.label = formValues.label || formValues.name;
    feature.name = formValues.name;
    if (formValues.type === 'other') {
      // Leaving the page rolls a field in error back to what it was, so the new type can still be missing here
      // even though the form holds Save until it is named
      if (isEmpty(formValues.otherType)) return false;
      feature.type = formValues.otherType;
      dispatch(addedCustomFeatureTypes([...projectFeatures, formValues.otherType]));
    }
    else feature.type = formValues.type;
    feature.description = formValues.description;
    otherFeatures.push(feature);
    const spotId = spot.properties.id;
    dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
    dispatch(editedSpotProperties({field: 'other_features', value: otherFeatures, spotId: spotId}));
    return true;
  };

  /* Render Functions */

  const renderForm = () => {
    // Validate the feature
    const validateFeature = (values) => {
      const errors = {};
      if (isEmpty(values.name)) errors.name = 'Feature name cannot be empty';
      if (isEmpty(values.type)) errors.type = 'Feature type cannot be empty';
      if (values.type === 'other') {
        if (isEmpty(values.otherType)) errors.otherType = 'New feature type cannot be empty';
        else if (projectFeatures.includes(values.otherType)) {
          errors.otherType = 'The type ' + values.otherType + ' is already being used';
        }
      }
      return errors;
    };

    const initialFeatureValues = {
      label: selectedFeature.label,
      name: selectedFeature.name,
      type: selectedFeature.type,
      otherType: '',
      description: selectedFeature.description,
    };

    return (
      <View style={{flex: 1}}>
        <FormikWrapper
          enableReinitialize={true}
          initialValues={initialFeatureValues}
          innerRef={formRef}
          setIsFormInvalid={setIsFormInvalid}
          validate={validateFeature}
        >
          {formProps => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    label={'Label'}
                    name={'label'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    isRequired={true}
                    label={'Name'}
                    name={'name'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <SelectInputField
                    choices={featureTypes.map(featureType => ({label: featureType, value: featureType}))}
                    isRequired={true}
                    isSingleSelect={true}
                    label={'Feature Type'}
                    name={'type'}
                  />
                </ListItem.Content>
              </ListItem>
              {formProps.values.type === 'other' && (
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <TextInputField
                      isRequired={true}
                      label={'Other Feature Type'}
                      name={'otherType'}
                    />
                  </ListItem.Content>
                </ListItem>
              )}
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    appearance={'multiline'}
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
        </FormikWrapper>
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader hideBackButton={!isReadOnly} onPressBack={cancelForm} pageTitle={page.label_singular + ' Detail'}/>
      {!isReadOnly && (
        <SaveAndCancelButtons
          cancel={cancelForm}
          getIsDisabled={isFormInvalid}
          save={() => saveForm(formRef.current)}
        />
      )}
      <FlatList
        ListHeaderComponent={renderForm()}
        contentContainerStyle={{paddingBottom: 300}}
      />
    </View>
  );
};

export default OtherFeatureDetail;
