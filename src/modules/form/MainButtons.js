import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {isRequired} from './form.helpers';
import {truncateText} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import {formStyles, useForm} from '../form';

const MainButtons = ({
                       formName,
                       formProps,
                       mainKeys,
                       setChoicesViewKey,
                       subkey,
                     }) => {
  /* Data Hooks */

  const {getLabel, getLabels, getSurvey} = useForm();

  /* Derived Variables */

  // A subkey'd form edits one nested object, e.g. associated_orientation[0], so the button shows that object's
  // selection rather than the one on the values around it
  const formValues = (subkey ? formProps?.values?.[subkey]?.[0] : formProps?.values) || {};
  const isSingle = mainKeys.length === 1;
  const survey = getSurvey(formName);

  /* Logic Helpers */

  // The choice a button opens is made on a screen of its own, so the button is the only place the field behind it
  // can be marked as one that must be answered, or told that it still is not
  const getFieldError = fieldKey => formProps?.errors?.[subkey ? subkey + '[0].' + fieldKey : fieldKey];

  const isFieldRequired = fieldKey => isRequired(survey.find(field => field.name === fieldKey) || {}, formValues);

  /* Render Functions */

  const renderMainButtonsText = (fieldKey) => {
    const fieldError = getFieldError(fieldKey);
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text style={formValues[fieldKey] ? formStyles.formButtonSelectedTitle : formStyles.formButtonTitle}>
          {getLabel(fieldKey, formName)}
          {isFieldRequired(fieldKey) && <Text style={formStyles.fieldRequired}> *</Text>}
        </Text>
        {!!formValues[fieldKey] && (
          <Text style={[formStyles.formButtonSelectedTitle, {fontWeight: 'bold'}]}>
            {truncateText(getLabels(formValues[fieldKey], formName, fieldKey), 23)}
          </Text>
        )}
        {!!fieldError && <Text style={formStyles.fieldError}>{fieldError}</Text>}
      </View>
    );
  };

  /* View */

  return (
    <View style={isSingle ? formStyles.fullWidthButtonContainer : formStyles.halfWidthButtonsContainer}>
      {mainKeys.map(k => (
        <Button
          buttonStyle={[formStyles.formButtonLarge, {
            backgroundColor: formValues[k] ? PRIMARY_ACCENT_COLOR : SECONDARY_BACKGROUND_COLOR,
          }]}
          containerStyle={isSingle ? formStyles.fullWidthButtonContainer : formStyles.halfWidthButtonContainer}
          key={k}
          onPress={() => setChoicesViewKey(k)}
          title={renderMainButtonsText(k)}
          type={'outline'}
        />
      ))}
    </View>
  );
};

export default MainButtons;
