import React from 'react';
import {Text, TextInput, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {isEmpty} from '../../shared/helpers';
import * as themes from '../../shared/styles.constants';
import {formStyles} from '../form';

const NumberInputField = ({
                            field: {name, onBlur, onChange, value},
                            form: {errors},
                            editable = true, label, onMyChange, onShowFieldInfo, placeholder,
                          }) => {
  /* Logic Helpers */

  const getDisplayValue = () => {
    if (!isEmpty(value)) return value.toString();
    return value || '';
  };

  /* View */

  return (
    <>
      <View style={formStyles.fieldLabelContainer}>
        <Text style={formStyles.fieldLabel}>{label}</Text>
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
        keyboardType={'numeric'}
        onBlur={onBlur(name)}
        onChangeText={onMyChange && typeof onMyChange === 'function' ? val => onMyChange(name, val) : onChange(name)}
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
