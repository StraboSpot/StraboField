import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useField, useFormikContext} from 'formik';

import {formStyles} from '.';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui/';

const AcknowledgeInput = ({
                            disabled = false,
                            isRequired,
                            label,
                            name,
                            onShowFieldInfo,
                            placeholder,
                            setFieldValueOverride,  // For a page that does its own work on a change
                          }) => {
  /* Data Hooks */

  const [{value}] = useField(name);
  // Read the errors from the form rather than take useField's meta.error - see TextInputField
  const {errors, setFieldValue} = useFormikContext();

  /* Derived Variables */

  const setValue = setFieldValueOverride || setFieldValue;

  /* View */

  return (
    <>
      <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', width: '100%'}}>
        <View style={{justifyContent: 'center'}}>
          <SwitchWrapper disabled={disabled} onValueChange={bool => setValue(name, bool)} value={value}/>
        </View>
        <View style={[formStyles.fieldLabelContainer, {flex: 1, paddingLeft: 5}]}>
          <Text style={[formStyles.fieldLabel, {fontWeight: 'normal'}]}>
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
      </View>
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default AcknowledgeInput;
