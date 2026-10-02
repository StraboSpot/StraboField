import React from 'react';
import {Pressable, Text} from 'react-native';

import {Icon} from '@rn-vui/base';

import sampleStyles from './samples.styles';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

// One of a sample's actions, laid out in a row of equal tiles: an icon over a short label, outlined like the app's
// other outline buttons and tinted while pressed, or grayed out when disabled
const SampleActionButton = ({accessibilityHint, disabled, iconName, onPress, title}) => {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={title}
      accessibilityRole={'button'}
      accessibilityState={{disabled: !!disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [sampleStyles.actionButton, pressed && sampleStyles.actionButtonPressed,
        disabled && sampleStyles.actionButtonDisabled]}
    >
      <Icon
        color={disabled ? MEDIUMGREY : PRIMARY_ACCENT_COLOR}
        name={iconName}
        size={24}
        type={'ionicon'}
      />
      <Text numberOfLines={1} style={[sampleStyles.actionButtonText, disabled && sampleStyles.actionButtonTextDisabled]}>
        {title}
      </Text>
    </Pressable>
  );
};

export default SampleActionButton;
