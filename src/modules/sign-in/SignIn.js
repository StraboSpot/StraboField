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
          buttonStyle={signInStyles.buttonStyle}
          containerStyle={signInStyles.buttonContainer}
          disabled={username === '' || password === '' || !isOnline.isConnected}
          loading={loading}
          onPress={handleSignIn}
          title={'Log In'}
          type={'solid'}
        />
        <Button
          buttonStyle={signInStyles.buttonStyle}
          containerStyle={signInStyles.buttonContainer}
          onPress={() => navigation.navigate('SignUp')}
          title={'Register'}
          type={'solid'}
        />
        <Button
          buttonStyle={signInStyles.buttonStyle}
          containerStyle={signInStyles.buttonContainer}
          onPress={handleGuestSignIn}
          title={'Continue as Guest'}
          type={'solid'}
        />
      </View>
    );
  };

  const renderErrorModal = () => {
    return (
      <ErrorModal
        closeModal={() => setIsErrorModalVisible(false)}
        isVisible={isErrorModalVisible}
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
            autoCapitalize={'none'}
            autoCorrect={false}
            keyboardType={'email-address'}
            onChangeText={val => setUsername(val.toLowerCase())}
            placeholder={'Email'}
            placeholderTextColor={themes.MEDIUMGREY}
            returnKeyType={'go'}
            style={signInStyles.input}
            value={username || ''}
          />
          <TextInput
            autoCapitalize={'none'}
            onChangeText={val => setPassword(val)}
            onSubmitEditing={() => signIn(username, password, setUsername, setPassword, setErrorMessage,
              setIsErrorModalVisible)}
            placeholder={'Password'}
            placeholderTextColor={themes.MEDIUMGREY}
            returnKeyType={'go'}
            secureTextEntry={true}
            style={signInStyles.input}
            value={password || ''}
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
