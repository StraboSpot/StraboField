import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useField, useFormikContext} from 'formik';

import * as themes from '../../shared/styles.constants';
import {formStyles} from '../form';

const TextInputField = ({
                          appearance,
                          autoCapitalize,
                          customHeight,
                          editable = true,
                          isRequired,
                          keyboardType,           // NumberInputField picks its own; a text field is given one
                          label,
                          name,
                          onBlurred,              // Runs as well as Formik's blur, which marks the field touched
                          onFocused,
                          onShowFieldInfo,
                          placeholder,
                          setFieldValueOverride,  // For a page that does its own work on a change
                        }) => {
  /* Data Hooks */

  const [{onBlur, value}] = useField(name);
  // A nested field is named by the path it sits at, e.g. associated_orientation[0].plunge, and its error is keyed
  // by that whole path as one string. Read the errors here rather than take useField's meta.error, which looks the
  // name up as a path into nested objects and so would never find it.
  const {errors, setFieldValue} = useFormikContext();

  /* Local State */

  const [isFocused, setIsFocused] = useState(false);

  /* Derived Variables */

  const setValue = setFieldValueOverride || setFieldValue;

  /* Logic Helpers */

  const getInputStyle = () => {
    let style;
    if (appearance === 'multiline') style = {...formStyles.fieldValue, ...formStyles.fieldValueMultiline};
    else if (appearance === 'fill') style = {...formStyles.fieldValue, ...formStyles.fieldValueFill};
    else if (appearance === 'full') style = {...formStyles.fieldValue, ...formStyles.fieldValueFull};
    else style = formStyles.fieldValue;

    if (customHeight) style = {...style, height: customHeight};

    return style;
  };

  /* View */

  return (
    <>
      {label && (
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
      )}
      <TextInput
        autoCapitalize={autoCapitalize}
        editable={editable}
        keyboardType={keyboardType}
        multiline={appearance === 'multiline' || appearance === 'full' || appearance === 'fill'}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur(name)(e);
          onBlurred && onBlurred(e);
        }}
        onChangeText={text => setValue(name, text)}
        onFocus={(e) => {
          setIsFocused(true);
          onFocused && onFocused(e);
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
