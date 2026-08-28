import React from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import {formStyles} from '../form';

const NumberInputField = ({
                            field: {name, onBlur, onChange, value},
                            form: {errors},
                            editable = true, isDecimalAllowed = true, isNegativeAllowed = true, isRequired, label,
                            onMyChange, onShowFieldInfo, placeholder,
                          }) => {
  /* Derived Variables */

  // iOS maps the numeric keyboard to a decimal pad, which has no minus sign, so a field that can hold a negative
  // needs the one keyboard that does - and that one carries letters and punctuation with it. A field whose survey
  // rules a negative out gets a plain pad instead, digits only where it rules out a decimal point too. Android's
  // numeric keyboard is already signed, and web has no on-screen keyboard to pick.
  const keyboardType = Platform.OS !== 'ios' ? 'numeric'
    : isNegativeAllowed ? 'numbers-and-punctuation'
      : isDecimalAllowed ? 'decimal-pad' : 'number-pad';

  /* Event Handlers */

  // The punctuation keyboard can type things a number cannot be made of, so drop those as they are typed rather
  // than drop the whole value at save time, which is what an unparsable number would otherwise come to.
  const onChangeNumber = (text) => {
    const numberText = text.replace(/[^\d.-]/g, '');
    if (onMyChange && typeof onMyChange === 'function') onMyChange(name, numberText);
    else onChange(name)(numberText);
  };

  /* Logic Helpers */

  const getDisplayValue = () => {
    if (!isEmpty(value)) return value.toString();
    return value || '';
  };

  /* View */

  return (
    <>
      <View style={formStyles.fieldLabelContainer}>
        <Text style={formStyles.fieldLabel}>
          {label}
          {isRequired && <Text style={formStyles.fieldRequired}> *</Text>}
        </Text>
        {placeholder && (
          <Icon
            color={themes.PRIMARY_ACCENT_COLOR}
            name={'information-circle-outline'}
            onPress={() => onShowFieldInfo(label, placeholder)}
            type={'ionicon'}
          />
        )}
      </View>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        onBlur={onBlur(name)}
        onChangeText={onChangeNumber}
        placeholder={placeholder}
        placeholderTextColor={themes.MEDIUMGREY}
        style={formStyles.fieldValue}
        value={getDisplayValue()}
      />
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default NumberInputField;
