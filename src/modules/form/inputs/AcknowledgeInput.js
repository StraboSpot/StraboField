import React from 'react';
import {Text, View} from 'react-native';

import {useField, useFormikContext} from 'formik';

import FieldLabel from './FieldLabel';
import SwitchWrapper from '../../../shared/ui/SwitchWrapper';
import formStyles from '../form.styles';

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
        <FieldLabel
          containerStyle={formStyles.acknowledgeLabelContainer}
          isRequired={isRequired}
          label={label}
          labelStyle={formStyles.acknowledgeLabel}
          onShowFieldInfo={onShowFieldInfo}
          placeholder={placeholder}
        />
      </View>
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default AcknowledgeInput;
