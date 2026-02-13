import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {useSelector} from 'react-redux';

import signInStyles from './signIn.styles';
import useSignIn from './useSignIn';
import {PASSWORD_TEST, USERNAME_TEST} from '../../../dev-test-logins';
import * as themes from '../../shared/styles.constants';
import {SECONDARY_BACKGROUND_COLOR, WHITE} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import CustomEndpoint from '../../shared/ui/CustomEndpoint';
import {ErrorModal} from '../../shared/ui/modals';
import GlyphDownloader from '../maps/GlyphDownloader';
import SplashScreen from '../splash-screen/SplashScreen';

const SignIn = ({navigation}) => {
  const isOnline = useSelector(state => state.connections.isOnline);
  const isEndpointSelected = useSelector(state => state.connections.databaseEndpoint.isSelected);

  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(__DEV__ ? PASSWORD_TEST : '');
  const [username, setUsername] = useState(__DEV__ ? USERNAME_TEST : '');

  const {guestSignIn, signIn} = useSignIn();

  const handleGuestSignIn = async () => {
    await guestSignIn();
    console.log('GUEST SIGN IN');
  };

  const handleRegister = () => navigation.navigate('SignUp');

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

  const renderButtons = () => {
    return (
      <View style={signInStyles.buttonsContainer}>
        <View>
          {isOnline.isConnected && (
            <ActionButton
              disabled={username === '' || password === '' || !isOnline.isConnected}
              isLoading={loading}
              onPress={handleSignIn}
              title={'Log In'}
            />
          )}
          <View style={{flexDirection: 'row'}}>
            <OutlineButton
              backgroundColor={SECONDARY_BACKGROUND_COLOR}
              onPress={handleGuestSignIn}
              title={'Continue as Guest'}
            />
            {isOnline.isConnected && !isEndpointSelected && (
              <OutlineButton
                backgroundColor={SECONDARY_BACKGROUND_COLOR}
                onPress={handleRegister}
                title={'Register'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderErrorModal = () => {
    return (
      <ErrorModal
        headerTitle={'Error Signing In!'}
        isVisible={isErrorModalVisible}
        onActionPressed={() => setIsErrorModalVisible(false)}
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
            containerStyles={{width: '80%'}}
            textStyles={{color: WHITE, fontSize: 14, textAlign: 'center'}}
          />
        </View>
        {renderErrorModal()}
      </View>
      <GlyphDownloader/>
    </SplashScreen>
  );
};

export default SignIn;
