import React, {useEffect, useState} from 'react';
import {Linking, Text, View} from 'react-native';

import {Button, CheckBox, Icon} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import sampleStyles from './samples.styles';
import useSamples from './useSamples';
import useServerRequests from '../../services/useServerRequests';
import {isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import PickerOverlay from '../../shared/ui/PickerOverlay';
import {setLoadingStatus} from '../home/home.slice';
import {setInitialSesarState, setSelectedUserCode, setSesarToken, setSesarUserCodes} from '../user/userProfile.slice';


const IGSNUploadAndRegister = ({handleIGSNChecked, isIGSNChecked, page, selectedFeature}) => {

  const {authenticateWithSesar, getAndSaveSesarCode} = useSamples();
  const toast = useToast();
  const {getSesarToken, getOrcidToken} = useServerRequests();

  const dispatch = useDispatch();
  const {userCodes, selectedUserCode, sesarToken} = useSelector(state => state.user.sesar);
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);

  // const [isIGSNChecked, setIsIGSNChecked] = useState(selectedFeature.isOnMySesar || false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  let tokens = sesarToken;

  useEffect(() => {
    getInitialUrl().then(() => console.log('LINKED'));
    const subscription = Linking.addEventListener('url', handleOpenURL);
    console.log('Subscribing');
    return () => {
      subscription.remove();
      console.log('Subscription removed from linking');
    };
  }, []);

  useEffect(() => {
    console.log('In 1st UE in IGSNUploadAndRegister page');
    isIGSNChecked && !isEmpty(sesarToken.access) && getSesarTokenAndCodes()
      .catch(err => console.log(err));
  }, [isIGSNChecked]);

  const getInitialUrl = async () => {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      handleOpenURL({url: initialUrl});
    }
  };

  const handleOpenURL = async ({url}) => {
    console.log('App resumed with URL:', url);
    if (url) {
      const code = url.split('/')[3];
      await getSesarTokenAndCodes(code);
    }
    else {
      console.log('No code found in URL.');
    }
  };

  const getSesarTokenAndCodes = async (orcidToken) => {
    try {
      if (orcidToken) {
        tokens = await getSesarToken(orcidToken);
        console.log('SESAR TOKEN', tokens);
        dispatch(setSesarToken(tokens));
      }
      if (tokens.access) {
        // const accessTokenParsed = JSON.parse(atob(tokens.access.split('.')[1]));
        tokens = await authenticateWithSesar(tokens);
        const sesarMessage = tokens.access ? 'SESAR Authenticated!' : 'SESAR NOT Authenticated!';
        toast.show(sesarMessage, {
          duration: 3000,
          type: tokens.access ? 'success' : 'danger',
          placement: 'bottom',
          textStyle: {fontSize: 20, fontStyle: 'italic'},
        });
        if (!selectedFeature.isOnMySesar) {
          const sesarCodesRes = await getAndSaveSesarCode(tokens);
          dispatch(setSesarUserCodes(sesarCodesRes.results.sesar_codes[0].sesar_code));
        }
        dispatch(setLoadingStatus({view: 'home', bool: false}));
        // handleIGSNChecked(true);
        // if (isEmpty(selectedUserCode)) setIsPickerVisible(true);
      }
      else return;
    }
    catch (err) {
      console.error(err);
      alert(err.toString());
    }
  };

  const handlePress = async () => {
    handleIGSNChecked(!isIGSNChecked);
  };

  const orcidAuthentication = async () => {
    await getOrcidToken();
  };

  const openPicker = () => {
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  const onUserCodeSelect = async (userCode) => {
    dispatch(setSelectedUserCode(userCode));
  };

  const renderIGSNUploadCheckbox = () => {
    return (
      <View style={{justifyContent: 'flex-start', alignItems: 'center'}}>
        {!selectedFeature.isOnMySesar
          && (
            <Text style={sampleStyles.mySesarUpdateDisclaimer}>To upload to your SESAR account and obtain an IGSN
              check below:</Text>
          )
        }
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <CheckBox
            title={'Upload to SESAR'}
            checked={isIGSNChecked}
            checkedTitle={selectedFeature.isOnMySesar && 'On SESAR and IGSN assigned'}
            onPress={handlePress}
            disabled={selectedFeature.isOnMySesar || !isInternetReachable}
          />
          {isIGSNChecked && isEmpty(selectedUserCode) && !selectedFeature.isOnMySesar && <Icon
            reverse
            name={'warning-outline'}
            type={'ionicon'}
            color={'red'}
            size={10}
            onPress={() => alert('SESAR Code Required')}
          />}
        </View>
      </View>
    );
  };

  const renderIGSNUserCodePicker = () => {
    return (
      <View style={{padding: 10, marginLeft: 20}}>
        {/*{!isEmpty(userCodes)*/}
        {/*  && (*/}
        {selectedFeature.Sample_IGSN && selectedFeature.sesarUserCode
          ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Text style={{fontSize: themes.MEDIUM_TEXT_SIZE, marginRight: 20}}>SESAR User
                Code: {selectedFeature.sesarUserCode}</Text>
            </View>
          ) : (
            <>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <Text style={{fontSize: themes.MEDIUM_TEXT_SIZE, marginRight: 20}}>SESAR User Code:</Text>
                <Button
                  raised
                  title={selectedUserCode || 'Select User Code'}
                  type={'outline'}
                  containerStyle={sampleStyles.userCodeButtonContainer}
                  iconRight
                  icon={<Icon
                    name={'chevron-down-outline'}
                    containerStyle={{paddingLeft: 5}}
                    type={'ionicon'}
                  />
                  }
                  disabled={selectedFeature.isOnMySesar}
                  disabledTitleStyle={{color: themes.BLACK}}
                  onPress={openPicker}
                  titleStyle={{fontSize: themes.MEDIUM_TEXT_SIZE, color: themes.BLACK}}
                />
              </View>
              <PickerOverlay
                isPickerVisible={isPickerVisible}
                data={userCodes}
                onSelect={onUserCodeSelect}
                value={selectedUserCode}
                closePicker={closePicker}
                dividerText={'Select User Code'}
              />
            </>
          )}
      </View>
    );
  };

  const renderOrcidSignInButton = () => (
    <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 20}}>
      <Text style={sampleStyles.mySesarUpdateDisclaimer}>Authenticate your SESAR account to upload a sample. You may
        be
        redirected to the ORCID login page.</Text>
      <Button
        title={'Authenticate With SESAR'}
        type={'clear'}
        containerStyle={{padding: 5}}
        onPress={orcidAuthentication}
      />
    </View>
  );

  const renderSesarUploadDisclosure = () => {
    if (!isInternetReachable) {
      return (
        <View style={{padding: 20}}>
          <Text style={sampleStyles.mySesarUpdateDisclaimer}>This sample has already been registered in your MYSESAR
            account with an IGSN number and needs to sync. You will need to be online make any updates.</Text>
        </View>
      );
    }
    else {
      return (
        <View style={{padding: 20}}>
          <Text style={sampleStyles.mySesarUpdateDisclaimer}>This sample has already been registered in your MYSESAR
            account. Any changes will be automatically updated. You may be prompted to sign into your MySesar
            account.</Text>
        </View>
      );
    }
  };

  return (
    <React.Fragment>
      {__DEV__ && <Button
        title="Delete SESAR values"
        type={'clear'}
        onPress={() => {
          dispatch(setInitialSesarState());
          handleIGSNChecked(false);
        }}
      />}
      <View>
        {selectedFeature?.isOnMySesar && renderSesarUploadDisclosure()}
        {renderIGSNUploadCheckbox()}
        {isEmpty(sesarToken.access) && isIGSNChecked && renderOrcidSignInButton()}
        {
          isIGSNChecked
          && !isEmpty(sesarToken.access)
          && renderIGSNUserCodePicker()
        }
      </View>
    </React.Fragment>
  );
};

export default IGSNUploadAndRegister;
