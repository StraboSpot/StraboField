import React, {useState} from 'react';

import {FAULT_MEASUREMENTS_KEYS} from './threeDStructures.constants';
import {Form, MainButtons} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';

const AddFault = ({formName, formProps, setChoicesViewKey, survey}) => {

  const [isFaultMeasurementsModalVisible, setIsFaultMeasurementsModalVisible] = useState(false);
  const [faultMeasurementsGroupField, setFaultMeasurementsGroupField] = useState({});

  // Relevant keys for quick-entry modal
  const firstKeys = ['label'];
  const mainButtonsKeys = ['fault_or_sz_type'];
  const secondButtonKeys = ['movement', 'movement_justification', 'directional_indicators'];
  const lastKeys = ['movement_amount_m', 'amplitude_m', 'folded_layer_thickness_m', 'fault_notes'];

  // Relevant fields for quick-entry modal
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  return (
    <>
      <Form {...{formName: formName, surveyFragment: firstKeysFields, ...formProps}}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={mainButtonsKeys}
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
        mainKeys={secondButtonKeys}
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
