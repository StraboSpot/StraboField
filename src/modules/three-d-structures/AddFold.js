import React, {useState} from 'react';

import {FoldGeometryButtons} from './fold-geometry';
import {
  ADD_FOLD_FIRST_KEYS,
  ADD_FOLD_LAST_KEYS,
  ADD_FOLD_MAIN_BUTTONS_KEYS,
  ADD_FOLD_TIGHTNESS_KEY,
  ADD_FOLD_VERGENCE_KEY,
  FOLD_MEASUREMENTS_KEYS,
} from './threeDStructures.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, FormSlider, MainButtons} from '../form';
import MeasurementButtons from '../form/MeasurementButtons';
import MeasurementModal from '../form/MeasurementModal';

const AddFold = ({choices, formName, formProps, setChoicesViewKey, survey}) => {
  /* Local State */

  const [foldMeasurementsGroupField, setFoldMeasurementsGroupField] = useState({});
  const [isFoldMeasurementsModalVisible, setIsFoldMeasurementsModalVisible] = useState(false);

  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const firstKeysFields = ADD_FOLD_FIRST_KEYS.map(k => survey.find(f => f.name === k));
  const lastKeysFields = ADD_FOLD_LAST_KEYS.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <Form {...formProps} formName={formName} surveyFragment={firstKeysFields}/>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={ADD_FOLD_MAIN_BUTTONS_KEYS}
        setChoicesViewKey={setChoicesViewKey}
      />
      <MeasurementButtons
        formProps={formProps}
        measurementsKeys={FOLD_MEASUREMENTS_KEYS}
        setIsMeasurementsModalVisible={setIsFoldMeasurementsModalVisible}
        setMeasurementsGroupField={setFoldMeasurementsGroupField}
        survey={survey}
      />
      <FoldGeometryButtons
        formProps={formProps}
        setChoicesViewKey={setChoicesViewKey}
      />
      <FormSlider
        choices={choices}
        fieldKey={ADD_FOLD_TIGHTNESS_KEY}
        formProps={formProps}
        hasNoneChoice={true}
        hasRotatedLabels={true}
        isHideLabels={true}
        showSliderValue={true}
        survey={survey}
      />
      <FormSlider
        choices={choices}
        fieldKey={ADD_FOLD_VERGENCE_KEY}
        formProps={formProps}
        hasNoneChoice={true}
        hasRotatedLabels={true}
        survey={survey}
      />
      <LittleSpacer/>
      <Form {...formProps} formName={formName} surveyFragment={lastKeysFields}/>
      {isFoldMeasurementsModalVisible && (
        <MeasurementModal
          formName={formName}
          formProps={formProps}
          measurementsGroup={FOLD_MEASUREMENTS_KEYS[foldMeasurementsGroupField.name]}
          measurementsGroupLabel={foldMeasurementsGroupField.label}
          setIsMeasurementModalVisible={setIsFoldMeasurementsModalVisible}
        />
      )}
    </>
  );
};

export default AddFold;
