import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';

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

  const {getLabel, getLabels} = useForm();

  /* Derived Variables */

  // A subkey'd form edits one nested object, e.g. associated_orientation[0], so the button shows that object's
  // selection rather than the one on the values around it
  const formValues = (subkey ? formProps?.values?.[subkey]?.[0] : formProps?.values) || {};
  const isSingle = mainKeys.length === 1;

  /* Render Functions */

  const renderMainButtonsText = fieldKey => (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Text style={formValues[fieldKey] ? formStyles.formButtonSelectedTitle : formStyles.formButtonTitle}>
        {getLabel(fieldKey, formName)}
      </Text>
      {!!formValues[fieldKey] && (
        <Text style={[formStyles.formButtonSelectedTitle, {fontWeight: 'bold'}]}>
          {truncateText(getLabels(formValues[fieldKey], formName, fieldKey), 23)}
        </Text>
      )}
    </View>
  );

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
