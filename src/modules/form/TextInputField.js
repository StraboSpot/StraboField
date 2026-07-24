import React, {useState} from 'react';
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
                          onFocus,
                          onBlur: onBlurProp,
                          onMyChange,
                          onShowFieldInfo,
                          placeholder,
                        }) => {
  /* Local State */

  const [isFocused, setIsFocused] = useState(false);

  /* Logic Helpers */

  const getInputStyle = () => {
    let style;
    if (appearance === 'multiline') {
      style = {...formStyles.fieldValue, ...formStyles.fieldValueMultiline};
    }
    else if (appearance === 'fill') {
      style = {...formStyles.fieldValue, ...formStyles.fieldValueFill};
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

  /* View */

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
        editable={editable}
        multiline={appearance === 'multiline' || appearance === 'full' || appearance === 'fill'}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur(name)(e);
          onBlurProp && onBlurProp(e);
        }}
        onChangeText={onMyChange && typeof onMyChange === 'function' ? val => onMyChange(name, val) : onChange(name)}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus && onFocus(e);
        }}
        placeholder={placeholder}
        placeholderTextColor={themes.MEDIUMGREY}
        scrollEnabled={appearance === 'full' ? isFocused : true}
        style={getInputStyle()}
        value={value || ''}
      />
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default TextInputField;
