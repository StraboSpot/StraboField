import React, {useContext, useRef} from 'react';
import {FlatList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {OTHER_FEATURE_FIELD_LABELS} from './otherFeatures.constants';
import {getEnteredLabel} from './otherFeatures.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FormikWrapper from '../form/FormikWrapper';
import SelectInputField from '../form/inputs/SelectInputField';
import TextInputField from '../form/inputs/TextInputField';
import useForm from '../form/useForm';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {resolveLabelOnSave} from '../page/featureLabels.helpers';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {addedCustomFeatureTypes, updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';
import useTags from '../tags/useTags';

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
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {getLabel, getLabels, submitAndShowErrors} = useForm();
  const {deleteFeatureTags} = useTags();

  const formRef = useRef(null);
  const {isFormDirty, isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => `Your changes to this ${page.label_singular} haven't been saved.`,
    onDiscard: hideFeatureDetail,
    save: () => saveForm(formRef.current),
  });

  /* Logic Helpers */

  const cancelForm = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    hideFeatureDetail();
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

  // Resolves whether the feature was saved. A refusal has already alerted about the field it stopped on.
  const saveForm = async (formCurrent) => {
    try {
      const {values: formValues} = await submitAndShowErrors(formRef.current || formCurrent);
      const existingFeature = spot.properties.other_features?.find(feature => feature.id === selectedFeature.id);
      // A copy, since the open feature is also the one in the Redux selection, which is frozen
      const featureToEdit = {...existingFeature || selectedFeature};
      if (!updateFeature(featureToEdit, formValues)) return false;
      markSaved();
      await formRef.current.resetForm();
      hideFeatureDetail();
      return true;
    }
    catch (err) {
      console.error('Error submitting form', err);
      return false;
    }
  };

  const updateFeature = (feature, formValues) => {
    feature.name = formValues.name;
    if (formValues.type === 'other') {
      // A field already in error when the form opened is rolled back rather than refused (see showErrors), so the
      // new type can still be missing here even though the form holds Save until it is named
      if (isEmpty(formValues.otherType)) return false;
      feature.type = formValues.otherType;
      dispatch(addedCustomFeatureTypes([...projectFeatures, formValues.otherType]));
    }
    else feature.type = formValues.type;
    feature.description = formValues.description;
    // Labeled last, since the title is built from the type and a custom type only arrives here
    feature.label = resolveLabelOnSave({
      pageKey: PAGE_KEYS.OTHER_FEATURES,
      previousFeature: selectedFeature, values: {...feature, label: formValues.label},
      getLabel: getLabel, getLabels: getLabels,
    }).label;
    // An edited feature keeps its place in the list
    const otherFeatures = [...spot.properties.other_features || []];
    const i = otherFeatures.findIndex(f => f.id === feature.id);
    if (i === -1) otherFeatures.push(feature);
    else otherFeatures.splice(i, 1, feature);
    const spotId = spot.properties.id;
    dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
    dispatch(editedSpotProperties({field: 'other_features', value: otherFeatures, spotId: spotId}));
    return true;
  };

  /* Render Functions */

  const renderForm = () => {
    // Worded like a survey's messages, which leave naming the field to its label
    const validateFeature = (values) => {
      const errors = {};
      if (isEmpty(values.name)) errors.name = 'Required';
      if (isEmpty(values.type)) errors.type = 'Required';
      if (values.type === 'other') {
        if (isEmpty(values.otherType)) errors.otherType = 'Required';
        else if (projectFeatures.includes(values.otherType)) {
          errors.otherType = 'The type ' + values.otherType + ' is already being used.';
        }
      }
      return errors;
    };

    const initialFeatureValues = {
      label: getEnteredLabel(selectedFeature),
      name: selectedFeature.name,
      type: selectedFeature.type,
      otherType: '',
      description: selectedFeature.description,
    };

    return (
      <View style={{flex: 1}}>
        <FormikWrapper
          enableReinitialize={true}
          fieldLabels={OTHER_FEATURE_FIELD_LABELS}
          initialValues={initialFeatureValues}
          innerRef={formRef}
          setIsFormDirty={setIsFormDirty}
          setIsFormInvalid={setIsFormInvalid}
          validate={validateFeature}
        >
          {formProps => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    editable={!isReadOnly}
                    label={OTHER_FEATURE_FIELD_LABELS.label}
                    name={'label'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    editable={!isReadOnly}
                    isRequired={true}
                    label={OTHER_FEATURE_FIELD_LABELS.name}
                    name={'name'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <SelectInputField
                    choices={featureTypes.map(
                      featureType => ({disabled: isReadOnly, label: featureType, value: featureType}))}
                    isReadOnly={isReadOnly}
                    isRequired={true}
                    isSingleSelect={true}
                    label={OTHER_FEATURE_FIELD_LABELS.type}
                    name={'type'}
                  />
                </ListItem.Content>
              </ListItem>
              {formProps.values.type === 'other' && (
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <TextInputField
                      editable={!isReadOnly}
                      isRequired={true}
                      label={OTHER_FEATURE_FIELD_LABELS.otherType}
                      name={'otherType'}
                    />
                  </ListItem.Content>
                </ListItem>
              )}
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <TextInputField
                    appearance={'multiline'}
                    editable={!isReadOnly}
                    label={OTHER_FEATURE_FIELD_LABELS.description}
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
          getIsDisabled={isFormInvalid || !isFormDirty}
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
