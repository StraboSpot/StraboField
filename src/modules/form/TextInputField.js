import React from 'react';
import {Text, TextInput, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import * as themes from '../../shared/styles.constants';
import {formStyles} from '../form';

const TextInputField = ({
                          field: {name, onBlur, onChange, value},
                          form: {errors},
                          appearance,
                          autoCapitalize,
                          customHeight,
                          editable = true,
                          label,
                          onMyChange,
                          onShowFieldInfo,
                          placeholder,
                        }) => {

  const getInputStyle = () => {
    let style;
    if (appearance === 'multiline') {
      style = {...formStyles.fieldValue, ...formStyles.fieldValueMultiline};
    }
    else if (appearance === 'full') {
      style = {...formStyles.fieldValue, ...formStyles.fieldValueFull};
    }
    else {
      style = formStyles.fieldValue;
    }

    if (customHeight) {
      style = {...style, height: customHeight};
    }

    return style;
  };

  return (
    <>
      {label && (
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
      )}
      <TextInput
        autoCapitalize={autoCapitalize}
        // autoFocus={autoFocus}
        editable={editable}
        multiline={appearance === 'multiline' || appearance === 'full'}
        onBlur={onBlur(name)}
        onChangeText={onMyChange && typeof onMyChange === 'function' ? val => onMyChange(name, val) : onChange(name)}
        placeholder={placeholder}
        placeholderTextColor={themes.MEDIUMGREY}
        style={getInputStyle()}
        value={value || ''}
      />
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default TextInputField;
