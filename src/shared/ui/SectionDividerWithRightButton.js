import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import SectionDivider from './SectionDivider';
import styles from '../../shared/ui/ui.styles';
import {PRIMARY_ACCENT_COLOR} from '../styles.constants';
import ClearButton from './buttons/ClearButton';

const SectionDividerWithRightButton = ({buttonTitle, disabled, dividerText, iconName, onPress}) => {

  const {isReadOnly} = useSelector(state => state.project.project);

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
      ) : isReadOnly ? null : (
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
