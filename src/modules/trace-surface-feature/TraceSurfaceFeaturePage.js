import React, {useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getTraceSurfaceFeatureLabel} from './traceSurfaceFeature.helpers';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import WarningModal from '../../shared/ui/modals/WarningModal';
import Form from '../form/Form';
import FormikWrapper from '../form/FormikWrapper';
import useForm from '../form/useForm';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {isLineSpot, isStratInterval} from '../spots/spots.helpers';
import {editedSpotProperties} from '../spots/spots.slice';

// The trace or surface feature of a line or polygon Spot, opened from its section on the Overview rather than as a
// notebook page of its own
const TraceSurfaceFeaturePage = ({closePage, isReadOnly}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {submitAndShowErrors} = useForm();

  /* Local State */

  const formRef = useRef(null);
  // Set once the edits are saved or discarded, so the page closing afterwards doesn't ask about them again
  const isDoneRef = useRef(false);

  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  // Kept after the warning is hidden so its text doesn't empty out while the modal animates closed
  const [warning, setWarning] = useState({});

  /* Derived Variables */

  const isTrace = isLineSpot(spot);
  const featureKey = isTrace ? 'trace' : 'surface_feature';
  const typeKey = isTrace ? 'trace_type' : 'surface_feature_type';
  const featureLabel = getTraceSurfaceFeatureLabel(spot);
  const formName = ['general', featureKey];
  const initialValues = spot.properties[featureKey] || {};

  /* Side Effects */

  // Leaving by anything but this page's own buttons - another notebook page, another Spot - unmounts it before
  // anything can be shown here, so those exits can only ask with an alert
  useLayoutEffect(() => {
    console.log('ULE TraceSurfaceFeaturePage []');
    return () => !isReadOnly && confirmLeavePage();
  }, []);

  /* Event Handlers */

  const handleCancelWarning = () => {
    setIsWarningVisible(false);
    warning.onCancel?.();
  };

  const handleConfirmWarning = () => {
    setIsWarningVisible(false);
    warning.onConfirm();
  };

  // Back and Cancel ask while the page is still here to ask from
  const handleLeavePress = () => {
    if (!hasUnsavedChanges()) closePage();
    else {
      showWarning({
        cancelTitle: 'Discard',
        confirmText: 'Save',
        message: getUnsavedChangesMessage(formRef.current.values),
        onCancel: discardAndClose,
        onConfirm: () => saveFormOnLeave(formRef.current),
        title: 'Unsaved Changes',
      });
    }
  };

  // A refusal has already alerted about the field it stopped on, so the form stays open for that to be fixed
  const handleSavePress = async () => {
    try {
      const {values: formValues} = await submitAndShowErrors(formRef.current);
      const removal = getRemoval(formValues);
      if (removal) {
        showWarning({
          confirmText: 'Remove',
          message: removal.message + ' Are you sure you want to continue?',
          onConfirm: () => saveFeature(formValues),
          title: removal.title,
        });
      }
      else saveFeature(formValues);
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  // What happens after submitting the form is handled in handleSavePress since we want to show
  // an alert message if there are errors but this function won't be called if form is invalid
  const onSubmitForm = () => {
    console.log('In onSubmitForm');
  };

  /* Logic Helpers */

  // Runs as the page unmounts, from the closure of its first render, so it reads the form rather than state
  const confirmLeavePage = () => {
    if (hasUnsavedChanges()) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        getUnsavedChangesMessage(formCurrent.values),
        [{
          text: 'No',
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveFormOnLeave(formCurrent),
        }],
        {cancelable: false},
      );
    }
  };

  const discardAndClose = () => {
    isDoneRef.current = true;
    closePage();
  };

  // What saving these values would take away, if anything. The type is what makes a Spot a trace or surface
  // feature, and a surface feature type of strat interval is what makes it an interval in its strat section.
  const getRemoval = (values) => {
    if (isStratInterval(spot) && values.surface_feature_type !== 'strat_interval') {
      return {
        message: 'This Spot will no longer be an interval in its strat section. Its interval data will be kept but'
          + ' hidden.',
        title: 'Remove Strat Interval?',
      };
    }
    if (!values[typeKey] && !isEmpty(Object.keys(initialValues).filter(key => key !== 'trace_feature'))) {
      const featureText = featureLabel.toLowerCase();
      return {
        message: 'Saving without a ' + featureText + ' type will delete all ' + featureText + ' data from this Spot.',
        title: 'Remove ' + featureLabel + '?',
      };
    }
    return null;
  };

  // A save on the way out gets no second warning, so a removal is mentioned up front
  const getUnsavedChangesMessage = (values) => {
    const removal = getRemoval(values);
    return 'Would you like to save your data before continuing?' + (removal ? ' ' + removal.message : '');
  };

  const hasUnsavedChanges = () => !isDoneRef.current && !!formRef.current?.dirty;

  // Saved to this page's Spot by id, since a save agreed to on the way out can land after another Spot is selected.
  // trace_feature is no longer in the form but is still written for the server and older app versions.
  const saveFeature = (formValues) => {
    console.log('Saving form data to Spot ...');
    const value = !formValues[typeKey] ? {} : isTrace ? {...formValues, 'trace_feature': true} : formValues;
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: featureKey, spotId: spot.properties.id, value: value}));
    isDoneRef.current = true;
    closePage();
  };

  // Leaving keeps what it can of an edit with a bad field rather than refusing it whole
  const saveFormOnLeave = async (formCurrent) => {
    try {
      const {values: formValues} = await submitAndShowErrors(formCurrent, true);
      saveFeature(formValues);
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  const showWarning = (newWarning) => {
    setWarning(newWarning);
    setIsWarningVisible(true);
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader onPressBack={handleLeavePress} pageTitle={featureLabel}/>
      {!isReadOnly && (
        <SaveAndCancelButtons cancel={handleLeavePress} getIsDisabled={isFormInvalid} save={handleSavePress}/>
      )}
      <FlatList
        ListHeaderComponent={
          <FormikWrapper
            enableReinitialize={true}
            formName={formName}
            initialValues={initialValues}
            innerRef={formRef}
            onSubmit={onSubmitForm}
            setIsFormInvalid={setIsFormInvalid}
          >
            {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
          </FormikWrapper>
        }
      />
      <WarningModal
        cancelTitle={warning.cancelTitle}
        closeModal={() => setIsWarningVisible(false)}
        confirmText={warning.confirmText}
        isContentSized
        isVisible={isWarningVisible}
        onCancelPress={handleCancelWarning}
        onConfirmPress={handleConfirmWarning}
        title={warning.title}
      >
        {warning.message}
      </WarningModal>
    </View>
  );
};

export default TraceSurfaceFeaturePage;
