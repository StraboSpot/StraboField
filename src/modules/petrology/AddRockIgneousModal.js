import React from 'react';

import {ADD_ROCK_KEYS, IGNEOUS_ROCK_CLASSES} from './petrology.constants';
import {isEmpty} from '../../shared/helpers';
import {Form, MainButtons} from '../form';

const AddRockIgneousModal = ({formName, formProps, setChoicesViewKey, survey}) => {
  /* Derived Variables */

  const igneousRockClass = formName[1];
  const {firstKeys, mainButtonsKeys, lastKeys} = igneousRockClass === IGNEOUS_ROCK_CLASSES.PLUTONIC
    ? ADD_ROCK_KEYS.igneous.plutonic : ADD_ROCK_KEYS.igneous.volcanic;

  /* Render Functions */

  const renderSpecificIgneousRock = () => {
    // Relevant fields for quick-entry modal
    const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k)).filter(k => !isEmpty(k));

    return (
      <>
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={firstKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
        <MainButtons
          formName={formName}
          formProps={formProps}
          mainKeys={mainButtonsKeys}
          setChoicesViewKey={setChoicesViewKey}
        />
        {!isEmpty(lastKeysFields) && <Form {...formProps} surveyFragment={lastKeysFields}/>}
      </>
    );
  };

  /* View */

  return (
    <>
      {!isEmpty(survey) && renderSpecificIgneousRock()}
    </>
  );
};

export default AddRockIgneousModal;
