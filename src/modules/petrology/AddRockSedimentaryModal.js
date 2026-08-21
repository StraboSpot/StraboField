import React from 'react';

import {ADD_ROCK_KEYS} from './petrology.constants';
import {Form, FormSlider, MainButtons} from '../form';

const {
  firstKeys, siliciclasticKeys, dunhamKeys, evaporiteKeys, organicCoalKeys,
  volcaniclasticKeys, phosphoriteKeys, weatheringKey, thirdKeys, lastKeys,
} = ADD_ROCK_KEYS.sedimentary;

const AddRockSedimentaryModal = ({choices, formName, formProps, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={firstKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      {formProps.values.primary_lithology === 'siliciclastic' && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={siliciclasticKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      {(formProps.values.primary_lithology === 'limestone' || formProps.values.primary_lithology === 'dolostone') && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={dunhamKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      {formProps.values.primary_lithology === 'evaporite' && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={evaporiteKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      {formProps.values.primary_lithology === 'organic_coal' && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={organicCoalKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      {formProps.values.primary_lithology === 'volcaniclastic' && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={volcaniclasticKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      {formProps.values.primary_lithology === 'phosphatic' && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={phosphoriteKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      <FormSlider
        choices={choices}
        fieldKey={weatheringKey}
        formProps={formProps}
        hasNoneChoice={true}
        hasRotatedLabels={true}
        isHideLabels={true}
        showSliderValue={true}
        survey={survey}
      />
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={thirdKeys}
        setChoicesViewKey={setChoicesViewKey}
      />
      <Form {...formProps} surveyFragment={lastKeysFields}/>
    </>
  );
};

export default AddRockSedimentaryModal;
