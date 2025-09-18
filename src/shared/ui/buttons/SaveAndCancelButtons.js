import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import styles from '../ui.styles';

const SaveAndCancelButtons = ({cancel, save, getIsDisabled}) => {
  return (
    <View style={styles.navButtonsContainer}>
      <View style={styles.leftContainer}>
        {cancel && (
          <Button
            onPress={cancel}
            title={'Cancel'}
            titleStyle={styles.buttonText}
            type={'clear'}
          />
        )}
        {save && (
          <Button
            disabled={getIsDisabled}
            onPress={save}
            title={'Save'}
            titleStyle={styles.buttonText}
            type={'clear'}
          />
        )}
      </View>
    </View>
  );
};

export default SaveAndCancelButtons;
