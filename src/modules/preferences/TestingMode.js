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

const TestingMode = ({isTestingMode, textStyles}) => {
  const dispatch = useDispatch();

  // const testingModePassword = 'Strab0R0cks';
  const testingModePassword = '12345';
  const errorMessage = 'Wrong Password!';

  const [password, setPassword] = useState('');
  const [isTestingModalVisible, setIsTestingModalVisible] = useState(false);
  const [isErrorMessage, setIsErrorMessage] = useState(false);

  useEffect(() => {
    console.log('UE Miscellaneous [password]', password);
    if (isEmpty(password)) setIsErrorMessage(false);
  }, [password]);

  const closeModal = () => {
    setIsTestingModalVisible(false);
    dispatch(setTestingMode(false));
    setIsErrorMessage(false);
  };

  const userEntry = (value) => {
    setPassword(value);
  };

  const onTestingSwitchChange = (value) => {
    setIsTestingModalVisible(value);
    dispatch(setTestingMode(value));
  };

  const verifyPassword = () => {
    if (password === testingModePassword) {
      setIsTestingModalVisible(false);
    }
    else setIsErrorMessage(true);
  };

  const renderPrompt = () => (
    <ModalWrapper
      actionTitle={'Ok'}
      headerTitle={'Enter Password'}
      isVisible={isTestingModalVisible}
      onActionPressed={verifyPassword}
      onCancelPress={closeModal}
    >
      <Text style={overlayStyles.importantText}>
        Data saved under pages that are in testing may NOT be compatible with future versions of StraboSpot.
      </Text>
      <Input
        defaultValue={''}
        errorMessage={isErrorMessage && errorMessage}
        onChangeText={userEntry}
        placeholder={'Password'}
        placeholderTextColor={themes.MEDIUMGREY}
      />
    </ModalWrapper>
  );


  return (
    <>
      <View style={styles.rowContainer}>
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
