import React from 'react';
import {View} from 'react-native';

import ClearButton from './buttons/ClearButton';
import SectionDivider from './SectionDivider';
import styles from './ui.styles';
import {PRIMARY_ACCENT_COLOR} from '../styles.constants';

const SectionDividerWithRightButton = ({buttonTitle, disabled, dividerText, iconName, leftIcon, onPress}) => {
  return (
    <View style={styles.sectionDividerWithButtonContainer}>
      <SectionDivider dividerText={dividerText} leftIcon={leftIcon}/>
      {buttonTitle ? (
        <ClearButton
          disabled={disabled}
          onPress={onPress}
          size={'sm'}
          title={buttonTitle}
        />
      ) : (
        <ClearButton
          disabled={disabled}
          icon={{
            color: PRIMARY_ACCENT_COLOR,
            name: iconName || 'add',
            onPress: onPress,
            size: 20,
            type: 'ionicon',
          }}
          onPress={onPress}
          size={'sm'}
        />
      )}
    </View>
  );
};

export default SectionDividerWithRightButton;
