import React from 'react';

import {
  ADD_PLANE_BEDDING_BUTTONS_KEYS,
  ADD_PLANE_CONTACT_BUTTONS_KEYS,
  ADD_PLANE_FAULT_BUTTONS_KEYS,
  ADD_PLANE_FIRST_KEYS,
  ADD_PLANE_FOLIATION_BUTTONS_KEYS,
  ADD_PLANE_FRACTURE_BUTTONS_KEYS,
  ADD_PLANE_LAST_KEYS,
  ADD_PLANE_MAIN_BUTTONS_KEYS,
  ADD_PLANE_VEIN_BUTTONS_KEYS,
} from './measurements.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import {Form, MainButtons} from '../form';

const AddPlane = ({formName, formProps, isManualMeasurement, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  const featureType = formProps?.values?.feature_type;
  const featureTypeSubKeys = featureType === 'bedding' ? ADD_PLANE_BEDDING_BUTTONS_KEYS
    : featureType === 'contact' ? ADD_PLANE_CONTACT_BUTTONS_KEYS
      : featureType === 'foliation' ? ADD_PLANE_FOLIATION_BUTTONS_KEYS
        : featureType === 'fracture' ? ADD_PLANE_FRACTURE_BUTTONS_KEYS
          : featureType === 'vein' ? ADD_PLANE_VEIN_BUTTONS_KEYS
            : featureType === 'fault' || featureType === 'shear_zone_bou' || featureType === 'shear_zone' ? ADD_PLANE_FAULT_BUTTONS_KEYS
              : undefined;
  const firstKeysFields = ADD_PLANE_FIRST_KEYS.map(k => survey.find(f => f.name === k));
  const lastKeysFields = ADD_PLANE_LAST_KEYS.map(k => survey.find(f => f.name === k));

  /* View */

  return (
    <>
      {!isManualMeasurement && (
        <Form {...formProps} formName={formName} surveyFragment={firstKeysFields}/>
      )}
      <MainButtons
        formName={formName}
        formProps={formProps}
        mainKeys={ADD_PLANE_MAIN_BUTTONS_KEYS}
        setChoicesViewKey={setChoicesViewKey}
      />
      {featureTypeSubKeys && (
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={featureTypeSubKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
      )}
      <LittleSpacer/>
      <Form {...formProps} formName={formName} surveyFragment={lastKeysFields}/>
    </>
  );
};

export default AddPlane;
