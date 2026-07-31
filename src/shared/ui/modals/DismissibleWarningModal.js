import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {CheckBox} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import {setIsWarningHidden} from '../../../modules/home/home.slice';
import {PRIMARY_TEXT_COLOR, SMALL_TEXT_SIZE} from '../../styles.constants';

// Reusable "heads-up" dialog with a persisted "Don't show this again" checkbox.
// warningKey should be a value from DISMISSIBLE_WARNINGS (home.constants); the checkbox state
// is committed to state.home.hiddenWarnings[warningKey] only when Continue is pressed.
const DismissibleWarningModal = ({headerTitle, isVisible, message, onCancel, onContinue, warningKey}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Local State */

  const [isDoNotShowChecked, setIsDoNotShowChecked] = useState(false);

  /* Event Handlers */

  const handleContinuePressed = () => {
    if (isDoNotShowChecked) dispatch(setIsWarningHidden({key: warningKey, isHidden: true}));
    onContinue();
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Continue'}
      cancelTitle={'Cancel'}
      headerTitle={headerTitle}
      isVisible={isVisible}
      onActionPressed={handleContinuePressed}
      onCancelPress={onCancel}
      overlayStyleOverride={{width: 350, height: 'auto'}}
      showActionButton
      showCancelButton
      showCloseButton={false}
    >
      <View style={{padding: 20}}>
        <Text style={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}>{message}</Text>
        <CheckBox
          checked={isDoNotShowChecked}
          containerStyle={{backgroundColor: 'transparent', borderWidth: 0, marginLeft: 0, marginTop: 10, padding: 4}}
          onPress={() => setIsDoNotShowChecked(!isDoNotShowChecked)}
          title={'Don\'t show this again'}
          titleStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}
        />
      </View>
    </ModalWrapper>
  );
};

export default DismissibleWarningModal;
