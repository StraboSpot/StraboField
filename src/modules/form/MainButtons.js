import React from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';

import {truncateText} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import {formStyles, useForm} from '../form';

const MainButtons = ({
                       formName,
                       formProps,
                       mainKeys,
                       setChoicesViewKey,
                     }) => {
  const {getLabel, getLabels} = useForm();

  const mainButtonsText = key => (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Text
        style={formProps?.values[key] ? formStyles.formButtonSelectedTitle : formStyles.formButtonTitle}>
        {getLabel(key, formName)}
      </Text>
      {formProps?.values[key] && (
        <Text style={[formStyles.formButtonSelectedTitle, {fontWeight: 'bold'}]}>
          {truncateText(getLabels(formProps.values[key], formName, key), 23)}
        </Text>
      )}
    </View>
  );

  return (
    <View
      style={mainKeys.length === 1 ? formStyles.fullWidthButtonContainer : formStyles.halfWidthButtonsContainer}>
      {mainKeys.map((k) => {
        return (
          <Button
            key={k}
            containerStyle={mainKeys.length === 1 ? formStyles.fullWidthButtonContainer : formStyles.halfWidthButtonContainer}
            buttonStyle={[formStyles.formButtonLarge, {
              backgroundColor: formProps?.values[k] ? PRIMARY_ACCENT_COLOR : SECONDARY_BACKGROUND_COLOR,
            }]}
            title={() => mainButtonsText(k)}
            type={'outline'}
            onPress={() => setChoicesViewKey(k)}
          />
        );
      })}
    </View>
  );
};

export default MainButtons;
