import React, {useState} from 'react';

import {
  ADD_FAULT_FIRST_KEYS,
  ADD_FAULT_LAST_KEYS,
  ADD_FAULT_MAIN_BUTTONS_KEYS,
  ADD_FAULT_SECOND_BUTTON_KEYS,
  FAULT_MEASUREMENTS_KEYS,
} from './threeDStructures.constants';
import {Form, MainButtons} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';

const AddFault = ({formName, formProps, setChoicesViewKey, survey}) => {
  /* Local State */

  const [faultMeasurementsGroupField, setFaultMeasurementsGroupField] = useState({});
  const [isFaultMeasurementsModalVisible, setIsFaultMeasurementsModalVisible] = useState(false);

  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const firstKeysFields = ADD_FAULT_FIRST_KEYS.map(k => survey.find(f => f.name === k));
  const lastKeysFields = ADD_FAULT_LAST_KEYS.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <Form {...{formName: formName, surveyFragment: firstKeysFields, ...formProps}}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={ADD_FAULT_MAIN_BUTTONS_KEYS}
        setChoicesViewKey={setChoicesViewKey}
      />
      <MeasurementButtons
        formProps={formProps}
        measurementsKeys={FAULT_MEASUREMENTS_KEYS}
        setIsMeasurementsModalVisible={setIsFaultMeasurementsModalVisible}
        setMeasurementsGroupField={setFaultMeasurementsGroupField}
        survey={survey}
      />
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={ADD_FAULT_SECOND_BUTTON_KEYS}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
      {isFaultMeasurementsModalVisible && (
        <MeasurementModal
          formName={formName}
          formProps={formProps}
          measurementsGroup={FAULT_MEASUREMENTS_KEYS[faultMeasurementsGroupField.name]}
          measurementsGroupLabel={faultMeasurementsGroupField.label}
          setIsMeasurementModalVisible={setIsFaultMeasurementsModalVisible}
        />
      )}
    </>
  );
};

export default AddFault;
