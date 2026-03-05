import React, {useState} from 'react';

import {
  ADD_OTHER_BOUDINAGE_FIRST_KEYS,
  ADD_OTHER_BOUDINAGE_THIRD_KEYS,
  ADD_OTHER_FIRST_KEYS,
  ADD_OTHER_LABEL_KEY,
  ADD_OTHER_LAST_KEYS,
  ADD_OTHER_LOBATE_CUSPATE_KEYS,
  ADD_OTHER_MULLION_FIRST_KEYS,
  ADD_OTHER_MULLION_THIRD_KEYS,
  BOUDINAGE_MEASUREMENTS_KEYS,
  MULLION_MEASUREMENTS_KEYS,
} from './threeDStructures.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, MainButtons} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';

const AddOther = ({formName, formProps, setChoicesViewKey, survey}) => {
  /* Local State */

  const [isOtherMeasurementsModalVisible, setIsOtherMeasurementsModalVisible] = useState(false);
  const [otherMeasurementsGroupField, setOtherMeasurementsGroupField] = useState({});

  /* Derived Variables */

  const boudinageKeysFields = ADD_OTHER_BOUDINAGE_THIRD_KEYS.map(k => survey.find(f => f.name === k));
  // Relevant fields for quick-entry modal
  const labelField = ADD_OTHER_LABEL_KEY.map(k => survey.find(f => f.name === k));
  const lastKeysFields = ADD_OTHER_LAST_KEYS.map(k => survey.find(f => f.name === k));
  const lobateCuspateKeysFields = ADD_OTHER_LOBATE_CUSPATE_KEYS.map(k => survey.find(f => f.name === k));
  const mullionKeysFields = ADD_OTHER_MULLION_THIRD_KEYS.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <Form {...{surveyFragment: labelField, ...formProps}}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={ADD_OTHER_FIRST_KEYS}
        setChoicesViewKey={setChoicesViewKey}
      />
      {formProps.values.feature_type === 'boudinage' && (
        <>
          <MainButtons
            formName={formName}
            formProps={formProps}
            mainKeys={ADD_OTHER_BOUDINAGE_FIRST_KEYS}
            setChoicesViewKey={setChoicesViewKey}
          />
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={BOUDINAGE_MEASUREMENTS_KEYS}
            setIsMeasurementsModalVisible={setIsOtherMeasurementsModalVisible}
            setMeasurementsGroupField={setOtherMeasurementsGroupField}
            survey={survey}
          />
          <Form {...{surveyFragment: boudinageKeysFields, ...formProps}}/>
          {isOtherMeasurementsModalVisible && (
            <MeasurementModal
              formName={formName}
              formProps={formProps}
              measurementsGroup={BOUDINAGE_MEASUREMENTS_KEYS[otherMeasurementsGroupField.name]}
              measurementsGroupLabel={otherMeasurementsGroupField.label}
              setIsMeasurementModalVisible={setIsOtherMeasurementsModalVisible}
            />
          )}
        </>
      )}
      {formProps.values.feature_type === 'mullion' && (
        <>
          <MainButtons
            formName={formName}
            formProps={formProps}
            mainKeys={ADD_OTHER_MULLION_FIRST_KEYS}
            setChoicesViewKey={setChoicesViewKey}
          />
          <MeasurementButtons
            formProps={formProps}
            measurementsKeys={MULLION_MEASUREMENTS_KEYS}
            setIsMeasurementsModalVisible={setIsOtherMeasurementsModalVisible}
            setMeasurementsGroupField={setOtherMeasurementsGroupField}
            survey={survey}
          />
          <Form {...{surveyFragment: mullionKeysFields, ...formProps}}/>
          {isOtherMeasurementsModalVisible && (
            <MeasurementModal
              formName={formName}
              formProps={formProps}
              measurementsGroup={MULLION_MEASUREMENTS_KEYS[otherMeasurementsGroupField.name]}
              measurementsGroupLabel={otherMeasurementsGroupField.label}
              setIsMeasurementModalVisible={setIsOtherMeasurementsModalVisible}
            />
          )}
        </>
      )}
      {formProps.values.feature_type === 'lobate_cuspate' && (
        <Form {...{surveyFragment: lobateCuspateKeysFields, ...formProps}}/>
      )}
      <LittleSpacer/>
      <Form {...{surveyFragment: lastKeysFields, ...formProps}}/>
    </>
  );
};

export default AddOther;
