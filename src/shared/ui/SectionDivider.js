import React from 'react';
import {Text, View} from 'react-native';

import styles from './ui.styles';

const SectionDivider = ({
                          dividerText,
                          leftIcon,
                          style,
                          subtitle,
                          textStyle,
                        }) => {
  return (
    <View style={[styles.sectionDivider, style, leftIcon && {alignItems: 'center', flexDirection: 'row'}]}>
      {leftIcon && <View style={{marginRight: 6}}>{leftIcon}</View>}
      <View>
        <Text style={[styles.sectionDividerText, textStyle]}>{dividerText.toUpperCase()}</Text>
        {subtitle && <Text style={styles.sectionDividerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

export default SectionDivider;
