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
        <SwitchWrapper onValueChange={bool => setFieldValue(name, bool)} value={value}/>
      </View>
      <View style={[formStyles.fieldLabelContainer, {flex: 1, paddingLeft: 5}]}>
        <Text style={[formStyles.fieldLabel, {fontWeight: 'normal'}]}>{label}</Text>
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
  );
};

export default AcknowledgeInput;
