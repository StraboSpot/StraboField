import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {Input} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import styles from './preferences.styles';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import {setTestingMode} from '../project/projects.slice';

const errorMessage = 'Wrong Password!';
const testingModePassword = 'Strab0R0cks';

const TestingMode = ({isTestingMode, textStyles}) => {
  /* Data Hooks / State */

  const dispatch = useDispatch();

  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const [isTestingModalVisible, setIsTestingModalVisible] = useState(false);
  const [password, setPassword] = useState(__DEV__ ? testingModePassword : '');

  /* Side Effects */

  useEffect(() => {
    console.log('UE Miscellaneous [password]', password);
    if (isEmpty(password)) setIsErrorMessage(false);
  }, [password]);

  /* Event Handlers */

  const onTestingSwitchChange = (value) => {
    setIsTestingModalVisible(value);
    dispatch(setTestingMode(value));
  };

  /* Logic Helpers */

  const closeModal = () => {
    setIsTestingModalVisible(false);
    dispatch(setTestingMode(false));
    setIsErrorMessage(false);
  };

  const userEntry = (value) => {
    setPassword(value);
  };

  const verifyPassword = () => {
    if (password === testingModePassword) {
      setIsTestingModalVisible(false);
    }
    else setIsErrorMessage(true);
  };

  /* Render Functions */

  const renderPrompt = () => (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Enter Password'}
      isVisible={isTestingModalVisible}
      onActionPressed={verifyPassword}
      onCancelPress={closeModal}
      overlayStyleOverride={{height: 'auto'}}
    >
      <Text style={overlayStyles.importantText}>
        Data saved under pages that are in testing may NOT be compatible with future versions of StraboSpot.
      </Text>
      <Input
        defaultValue={__DEV__ ? testingModePassword : ''}
        errorMessage={isErrorMessage && errorMessage}
        onChangeText={userEntry}
        placeholder={'Password'}
        placeholderTextColor={themes.MEDIUMGREY}
      />
    </ModalWrapper>
  );

  /* View */

  return (
    <>
      <View style={[styles.rowContainer, {paddingHorizontal: 10, paddingVertical: 5}]}>
        <Text style={[commonStyles.listItemTitle, textStyles]}>
          Use Testing Mode?
        </Text>
        <SwitchWrapper
          onValueChange={onTestingSwitchChange}
          value={isTestingMode}
        />
      </View>
      {renderPrompt()}
    </>
  );
};

export default TestingMode;
