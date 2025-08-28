import React from 'react';
import {Switch, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import {formStyles} from './index';
import * as themes from '../../shared/styles.constants';

const AcknowledgeInput = ({
                            label,
                            name,
                            onShowFieldInfo,
                            placeholder,
                            setFieldValue,
                            value,
                          }) => {
  return (
    <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start'}}>
      <View>
        <Switch
          value={value}
          onValueChange={bool => setFieldValue(name, bool)}
        />
      </View>
      <View style={[formStyles.fieldLabelContainer, {flex: 1, paddingLeft: 5}]}>
        <Text style={[formStyles.fieldLabel, {fontWeight: 'normal'}]}>{label}</Text>
        {placeholder && (
          <Icon
            name={'information-circle-outline'}
            type={'ionicon'}
            color={themes.PRIMARY_ACCENT_COLOR}
            onPress={() => onShowFieldInfo(label, placeholder)}
          />
        )}
      </View>
    </View>
  );
};

export default AcknowledgeInput;
