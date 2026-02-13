import React, {useState} from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';

import {useSelector} from 'react-redux';

import styles from './signUp.styles';
import useServerRequests from '../../services/useServerRequests';
import {validate} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {SECONDARY_BACKGROUND_COLOR} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SplashScreen from '../splash-screen/SplashScreen';

const SignUp = ({navigation}) => {
  const initialState = {
    firstName: {
      value: '',
      valid: false,
      validationRules: {
        notEmpty: false,
      },
      touched: false,
    },
    lastName: {
      value: '',
      valid: false,
      validationRules: {
        notEmpty: false,
      },
      touched: false,
    },
    password: {
      value: '',
      valid: false,
      validationRules: {
        characterValidator: false,
      },
      touched: false,
      showPassword: false,
    },
    confirmPassword: {
      value: '',
      valid: false,
      validationRules: {
        equalTo: 'password',
      },
      touched: false,
    },
    email: {
      value: '',
      valid: false,
      validationRules: {
        isEmail: true,
      },
      touched: false,
    },
  };

  const isOnline = useSelector(state => state.connections.isOnline);

  const {registerUser} = useServerRequests();

  const [isLoading, setIsLoading] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusDialogTitle, setStatusDialogTitle] = useState(null);
  const [statusType, setStatusType] = useState('info'); // 'success', 'error', 'info'
  const [userData, setUserData] = useState(initialState);

  // Helper function to format success messages
  const formatMessage = (message, isSuccess = false) => {
    if (isSuccess) {
      return message;
    }

    // Check if it looks like validation errors (contains "cannot be blank" or similar patterns)
    if (message.includes('cannot be blank') || message.includes('is invalid') || message.includes('must')) {
      return parseValidationErrors(message);
    }

    // For other messages, just clean up the formatting
    return message.replace(/\./g, '.\n');
  };

  const getModalStyles = () => {
    // You can customize modal appearance based on status type
    switch (statusType) {
      case 'success':
        return {
          headerStyle: {backgroundColor: '#d4edda'},
          titleStyle: {color: '#155724'},
        };
      case 'error':
        return {
          headerStyle: {backgroundColor: '#f8d7da'},
          titleStyle: {color: '#721c24'},
        };
      default:
        return {};
    }
  };

  const onChangeText = (key, value) => {
    let connectedValue = {};

    // Checks to see if password and confirm password match
    if (userData[key].validationRules.equalTo) {
      const equalControl = userData[key].validationRules.equalTo;
      const equalValue = userData[equalControl].value;
      connectedValue = {
        ...connectedValue,
        equalTo: equalValue,
      };
    }
    if (key === 'password') {
      connectedValue = {
        ...connectedValue,
        equalTo: value,
      };
    }

    setUserData(prevState => ({
      ...prevState,
      confirmPassword: {
        ...prevState.confirmPassword,
        valid: key === 'password'
          ? validate(prevState.confirmPassword.value, prevState.confirmPassword.validationRules, connectedValue)
          : prevState.confirmPassword.valid,
      },
      [key]: {
        ...prevState[key],
        value: value,
        valid: validate(value, prevState[key].validationRules, connectedValue),
        touched: true,
      },
    }));
  };

  // Helper function to parse validation errors
  const parseValidationErrors = (message) => {
    if (!message) return [];

    // Split by periods and filter out empty strings
    const errors = message.split('.').filter(error => error.trim().length > 0);

    // Format as bullet points for better readability
    return errors.map(error => `• ${error.trim()}`).join('\n');
  };

  const renderButtons = () => {
    return (
      <>
        <ActionButton
          disabled={!isOnline.isInternetReachable}
          onPress={signUp}
          title={'Register'}
        />
        <OutlineButton
          backgroundColor={SECONDARY_BACKGROUND_COLOR}
          onPress={() => navigation.goBack()}
          title={'Back to Log In'}
        />
      </>
    );
  };

  const signUp = async () => {
    console.log('ConnectedValue', userData.password.value);
    setIsLoading(true);
    try {
      const newUser = await registerUser(userData);
      console.log('res', newUser);

      if (newUser.valid === true || newUser.valid === 'true') {
        // Success case
        if (newUser.message.includes('A confirmation link has been emailed')) {
          setStatusDialogTitle('Welcome!');
          setStatusType('success');
          setUserData(initialState);
          console.log('user successfully signed up!');
        }
        else {
          setStatusDialogTitle('Registration Complete');
          setStatusType('success');
        }

        setStatusMessage(formatMessage(newUser.message, true));
        setIsLoading(false);
        setStatusDialog(true);
      }
      else {
        // Validation error case
        setIsLoading(false);
        setStatusDialogTitle('Please Fix These Issues');
        setStatusType('error');
        setStatusMessage(formatMessage(newUser.message, false));
        setStatusDialog(true);
      }
    }
    catch (err) {
      console.log('error signing up: ', err);
      setIsLoading(false);
      setStatusDialogTitle('Connection Error');
      setStatusType('error');
      setStatusMessage('Unable to create account.\nPlease check your internet connection and try again.');
      setStatusDialog(true);
    }
  };

  return (
    <>
      <SplashScreen>
        <View style={styles.signUpContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={val => onChangeText('firstName', val)}
              placeholder={'First Name'}
              placeholderTextColor={themes.MEDIUMGREY}
              style={styles.input}
              value={userData.firstName.value || ''}
            />
            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={val => onChangeText('lastName', val)}
              placeholder={'Last Name'}
              placeholderTextColor={themes.MEDIUMGREY}
              style={styles.input}
              value={userData.lastName.value || ''}
            />
          </View>

          <View style={{width: '100%'}}>
            <Text style={styles.text}>
              Password must contain at least one uppercase, one digit, and no spaces
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={val => onChangeText('password', val)}
              placeholder={'Password'}
              placeholderTextColor={themes.MEDIUMGREY}
              secureTextEntry={true}
              style={styles.input}
              value={userData.password.value || ''}
            />
            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={val => onChangeText('confirmPassword', val)}
              placeholder={'Confirm Password'}
              placeholderTextColor={themes.MEDIUMGREY}
              secureTextEntry={true}
              style={styles.input}
              value={userData.confirmPassword.value || ''}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              keyboardType={'email-address'}
              onChangeText={val => onChangeText('email', val)}
              placeholder={'Email'}
              placeholderTextColor={themes.MEDIUMGREY}
              style={styles.input}
              value={userData.email.value || ''}
            />
          </View>

          {renderButtons()}
        </View>

        <ModalWrapper
          actionTitle={'Got It'}
          headerTitle={statusDialogTitle}
          isVisible={statusDialog}
          onActionPressed={() => setStatusDialog(false)}
          showCancelButton={false}
          {...getModalStyles()}
        >
          <ScrollView style={{maxHeight: 200}}>
            <Text style={{
              fontSize: 16,
              lineHeight: 24,
              color: statusType === 'error' ? '#721c24' : '#333',
            }}>
              {statusMessage}
            </Text>
          </ScrollView>
        </ModalWrapper>
      </SplashScreen>
      <Loading isLoading={isLoading}/>
    </>
  );
};

export default SignUp;
