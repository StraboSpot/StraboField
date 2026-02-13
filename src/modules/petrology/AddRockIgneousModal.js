import React from 'react';

import {IGNEOUS_ROCK_CLASSES} from './petrology.constants';
import {isEmpty} from '../../shared/Helpers';
import {Form, MainButtons} from '../form';

const AddRockIgneousModal = ({formName, formProps, setChoicesViewKey, survey}) => {
  const igneousRockClass = formName[1];

  const renderSpecificIgneousRock = () => {
    // Relevant keys for quick-entry modal
    let firstKeys, mainButtonsKeys, lastKeys;
    if (igneousRockClass === IGNEOUS_ROCK_CLASSES.PLUTONIC) {
      firstKeys = ['plutonic_rock_type'];
      mainButtonsKeys = ['occurence_plutonic', 'texture_plutonic', 'color_index_pluton', 'alteration_plutonic'];
      lastKeys = ['pluton_characteristic_size_of', 'notes_plutonic'];
    }
    else {
      firstKeys = ['volcanic_rock_type'];
      mainButtonsKeys = ['occurence_volcanic', 'texture_volcanic', 'color_index_volc', 'alteration_volcanic'];
      lastKeys = ['vol_characteristic_size_of_cry', 'notes_volcanic'];
    }

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
        {!isEmpty(lastKeysFields) && <Form {...{surveyFragment: lastKeysFields, ...formProps}}/>}
      </>
    );
  };

  return (
    <>
      {!isEmpty(survey) && renderSpecificIgneousRock()}
    </>
  );
};

export default AddRockIgneousModal;
