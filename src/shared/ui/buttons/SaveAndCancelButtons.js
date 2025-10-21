import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import buttonsStyles from './buttons.styles';
import commonStyles from '../../common.styles';

const SaveAndCancelButtons = ({cancel, save, getIsDisabled}) => {
  return (
    <View style={buttonsStyles.navButtonsContainer}>
      {cancel && (
        <Button
          onPress={cancel}
          title={'Cancel'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
        />
      )}
      {save && (
        <Button
          disabled={getIsDisabled}
          onPress={save}
          title={'Save'}
          titleStyle={commonStyles.standardButtonText}
          type={'clear'}
        />
      )}
    </View>
  );
};

export default SaveAndCancelButtons;
