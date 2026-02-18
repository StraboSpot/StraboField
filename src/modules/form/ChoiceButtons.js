import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import {formStyles, useForm} from '../form';

const ChoiceButtons = ({
                         choiceFieldKey,
                         choices,
                         formProps,
                         onPress,
                         size,
                         survey,
                       }) => {
  /* Data Hooks */

  const {getChoicesByKey} = useForm();

  /* Derived Variables */

  const buttonStyle = size === 'small' ? formStyles.formButtonSmall
    : size === 'large' ? formStyles.formButtonLarge
      : formStyles.formButton;

  /* View */

  return (
    <View style={formStyles.halfWidthButtonsContainer}>
      {getChoicesByKey(survey, choices, choiceFieldKey).map((choice) => {
        return (
          <Button
            buttonStyle={[buttonStyle, {
              backgroundColor: formProps?.values[choiceFieldKey]?.includes(choice.name) ? PRIMARY_ACCENT_COLOR
                : SECONDARY_BACKGROUND_COLOR,
            }]}
            containerStyle={formStyles.halfWidthButtonContainer}
            key={choice.name}
            onPress={() => onPress(choice.name)}
            title={choice.label}
            titleProps={{
              style: formProps?.values[choiceFieldKey]?.includes(choice.name)
                ? formStyles.formButtonSelectedTitle
                : formStyles.formButtonTitle,
              numberOfLines: 2,
              ellipsizeMode: 'tail',
            }}
            type={'outline'}
          />
        );
      })}
    </View>
  );
};

export default ChoiceButtons;
