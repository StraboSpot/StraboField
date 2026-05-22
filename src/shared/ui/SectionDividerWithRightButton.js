import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import ClearButton from './buttons/ClearButton';
import SectionDivider from './SectionDivider';
import styles from './ui.styles';
import {PRIMARY_ACCENT_COLOR} from '../styles.constants';

const SectionDividerWithRightButton = ({buttonTitle, disabled, dividerText, iconName, onPress}) => {

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project.project);

  return (
    <View style={styles.sectionDividerWithButtonContainer}>
      <SectionDivider dividerText={dividerText}/>
      {buttonTitle ? (
        <ClearButton
          disabled={disabled}
          onPress={onPress}
          size={'sm'}
          title={buttonTitle}
        />
      ) : isReadOnlyProject ? null : (
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
