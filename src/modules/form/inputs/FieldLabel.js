import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import formStyles from '../form.styles';

// The label above a field: its text, the asterisk of a required one, and the button that shows its hint. The style
// overrides are for a field that puts its label somewhere other than in a row of its own - see AcknowledgeInput
const FieldLabel = ({
                      containerStyle,
                      isRequired,
                      label,
                      labelStyle,
                      onShowFieldInfo,
                      placeholder,  // The field's hint, which the button shows; a field without one gets no button
                    }) => {
  /* View */

  return (
    <View style={[formStyles.fieldLabelContainer, containerStyle]}>
      <Text style={[formStyles.fieldLabel, labelStyle]}>
        {label}
        {isRequired && <Text style={formStyles.fieldRequired}> *</Text>}
      </Text>
      {placeholder && (
        <Icon
          color={PRIMARY_ACCENT_COLOR}
          name={'information-circle-outline'}
          onPress={() => onShowFieldInfo(label, placeholder)}
          type={'ionicon'}
        />
      )}
    </View>
  );
};

export default FieldLabel;
