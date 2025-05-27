import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import signInStyles from './signIn.styles';
import useSignIn from './useSignIn';
import {PASSWORD_TEST, USERNAME_TEST} from '../../../dev-test-logins';
import * as themes from '../../shared/styles.constants';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import {ErrorModal} from '../home/modals';
import GlyphDownloader from '../maps/GlyphDownloader';
import SplashScreen from '../splash-screen/SplashScreen';
import {login} from '../user/userProfile.slice';

const SignIn = ({navigation, route}) => {

  const dispatch = useDispatch();
  const isOnline = useSelector(state => state.connections.isOnline);

  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(__DEV__ ? PASSWORD_TEST : '');
  const [username, setUsername] = useState(__DEV__ ? USERNAME_TEST : '');

  const {guestSignIn, signIn} = useSignIn();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn(username, password, setUsername, setPassword, setErrorMessage, setIsErrorModalVisible);
      setLoading(false);
    }
    catch (err) {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    await guestSignIn();
    dispatch(login());
  };

  const renderButtons = () => {
    return (
      <View style={signInStyles.buttonsContainer}>
        <Button
          type={'solid'}
          containerStyle={signInStyles.buttonContainer}
          onPress={handleSignIn}
          buttonStyle={signInStyles.buttonStyle}
          disabled={username === '' || password === '' || !isOnline.isConnected}
          title={'Log In'}
          loading={loading}
        />
        <Button
          type={'solid'}
          containerStyle={signInStyles.buttonContainer}
          onPress={() => navigation.navigate('SignUp')}
          buttonStyle={signInStyles.buttonStyle}
          title={'Register'}
        />
        <Button
          type={'solid'}
          onPress={handleGuestSignIn}
          containerStyle={signInStyles.buttonContainer}
          buttonStyle={signInStyles.buttonStyle}
          title={'Continue as Guest'}
        />
      </View>
    );
  };

  const renderErrorModal = () => {
    return (
      <ErrorModal
        isVisible={isErrorModalVisible}
        closeModal={() => setIsErrorModalVisible(false)}
      >
        <Text style={signInStyles.errorText}>{errorMessage.toString()}</Text>
      </ErrorModal>
    );
  };

  return (
    <SplashScreen>
      <View style={{marginTop: 20}}>
        <View style={signInStyles.signInContainer}>
          <TextInput
            style={signInStyles.input}
            placeholder={'Email'}
            autoCapitalize={'none'}
            autoCorrect={false}
            placeholderTextColor={themes.MEDIUMGREY}
            onChangeText={val => setUsername(val.toLowerCase())}
            value={username || ''}
            keyboardType={'email-address'}
            returnKeyType={'go'}
          />
          <TextInput
            style={signInStyles.input}
            placeholder={'Password'}
            autoCapitalize={'none'}
            secureTextEntry={true}
            placeholderTextColor={themes.MEDIUMGREY}
            onChangeText={val => setPassword(val)}
            value={password || ''}
            returnKeyType={'go'}
            onSubmitEditing={() => signIn(username, password, setUsername, setPassword, setErrorMessage,
              setIsErrorModalVisible)}
          />
          {renderButtons()}
          <CustomEndpoint
            containerStyles={{width: '70%'}}
            textStyles={signInStyles.customEndpointText}/>
        </View>
        {renderErrorModal()}
      </View>
      <GlyphDownloader/>
    </SplashScreen>
  );
};

export default SignIn;
