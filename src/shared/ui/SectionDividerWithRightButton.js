import React from 'react';
import {View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';

import SectionDivider from './SectionDivider';
import styles from '../../shared/ui/ui.styles';
import commonStyles from '../common.styles';
import {PRIMARY_ACCENT_COLOR} from '../styles.constants';

const SectionDividerWithRightButton = ({buttonTitle, disabled, dividerText, iconName, iconType, iconSize, onPress}) => {
  return (
    <View style={styles.sectionDividerWithButtonContainer}>
      <SectionDivider dividerText={dividerText} style={{borderBottomWidth: 0}}/>
      <Button
        disabled={disabled}
        icon={!buttonTitle && (
          <Icon
            color={PRIMARY_ACCENT_COLOR}
            name={iconName || 'add'}
            onPress={onPress}
            size={iconSize || 20}
            style={{paddingHorizontal: 5}}
            type={iconType || 'ionicon'}
          />
        )}
        onPress={onPress}
        size={'sm'}
        title={buttonTitle}
        titleStyle={commonStyles.standardButtonText}
        type={'clear'}
      />
    </View>
  );
};

export default SectionDividerWithRightButton;
