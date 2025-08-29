import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {formStyles} from '.';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui/';

const AcknowledgeInput = ({
                            label,
                            name,
                            onShowFieldInfo,
                            placeholder,
                            setFieldValue,
                            value,
                          }) => {
  return (
    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', width: '100%'}}>
      <View style={{justifyContent: 'center'}}>
        <SwitchWrapper value={value} onValueChange={bool => setFieldValue(name, bool)}/>
      </View>
      <View style={[formStyles.fieldLabelContainer, {flex: 1, paddingLeft: 5}]}>
        <Text style={[formStyles.fieldLabel, {fontWeight: 'normal'}]}>{label}</Text>
        {placeholder && (
          <Icon
            name={'information-circle-outline'}
            type={'ionicon'}
            color={PRIMARY_ACCENT_COLOR}
            onPress={() => onShowFieldInfo(label, placeholder)}
          />
        )}
      </View>
    </View>
  );
};

export default AcknowledgeInput;
