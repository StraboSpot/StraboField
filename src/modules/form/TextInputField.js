import React, {useCallback} from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';

import {useFocusEffect} from '@react-navigation/native';
import {Icon} from '@rn-vui/base';
import KeyboardManager from 'react-native-keyboard-manager';

import * as themes from '../../shared/styles.constants';
import {formStyles} from '../form';

const TextInputField = ({
                          field: {name, onBlur, onChange, value},
                          form: {errors, touched},
                          appearance,
                          autoCapitalize,
                          autoFocus,
                          editable,
                          label,
                          onMyChange,
                          onShowFieldInfo,
                          placeholder,
                        }) => {

  const onFocusEffect = useCallback(() => {
    if (Platform.OS === 'ios') {
      KeyboardManager.setToolbarDoneBarButtonItemText('Close Keyboard');
      KeyboardManager.setEnableAutoToolbar(true);
    }
  }, []);

  useFocusEffect(onFocusEffect);

  return (
    <>
      {label && (
        <View style={formStyles.fieldLabelContainer}>
          <Text style={formStyles.fieldLabel}>{label}</Text>
          {placeholder && (
            <Icon
              name={'information-circle-outline'}
              type={'ionicon'}
              color={themes.PRIMARY_ACCENT_COLOR}
              onPress={() => onShowFieldInfo(label, placeholder)}
            />
          )}
        </View>
      )}
      <TextInput
        onChangeText={onMyChange && typeof onMyChange === 'function' ? val => onMyChange(name, val) : onChange(name)}
        onBlur={onBlur(name)}
        style={appearance === 'multiline' ? {...formStyles.fieldValue, ...formStyles.fieldValueMultiline}
          : appearance === 'full' ? {...formStyles.fieldValue, ...formStyles.fieldValueFull}
            : formStyles.fieldValue}
        value={value || ''}
        placeholder={placeholder}
        placeholderTextColor={themes.MEDIUMGREY}
        multiline={appearance === 'multiline' || appearance === 'full'}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default TextInputField;
