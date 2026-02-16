import React, {useEffect, useState} from 'react';
import {Linking, Text, View} from 'react-native';

import {Button, CheckBox, Icon} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import sampleStyles from './samples.styles';
import useSamples from './useSamples';
import useServerRequests from '../../services/useServerRequests';
import {isEmpty} from '../../shared/Helpers';
import {BLACK, MEDIUM_TEXT_SIZE, WARNING_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import PickerOverlay from '../../shared/ui/modals/PickerOverlay';
import {setLoadingStatus} from '../home/home.slice';
import {setInitialSesarState, setSelectedUserCode, setSesarToken, setSesarUserCodes} from '../user/userProfile.slice';

const IGSNUploadAndRegister = ({handleIGSNChecked, isIGSNChecked, selectedFeature}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);
  const {userCodes, selectedUserCode, sesarToken} = useSelector(state => state.user?.sesar || {});

  const {authenticateWithSesar, getAndSaveSesarCode} = useSamples();
  const {getSesarToken, getOrcidToken} = useServerRequests();
  const toast = useToast();

  /* Local State */

  // const [isIGSNChecked, setIsIGSNChecked] = useState(selectedFeature.isOnMySesar || false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  /* Derived Variables */

  let tokens = sesarToken;

  /* Side Effects */

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleOpenURL);
    console.log('Subscribing');
    return () => {
      subscription.remove();
      console.log('Subscription removed from linking');
    };
  }, []);

  useEffect(() => {
    console.log('In 1st UE in IGSNUploadAndRegister page');
    isIGSNChecked && !isEmpty(sesarToken?.access) && getSesarTokenAndCodes()
      .catch(err => console.log(err));
  }, [isIGSNChecked]);

  /* Event Handlers */

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

  const handlePress = async () => {
    handleIGSNChecked(!isIGSNChecked);
  };

  const onReset = () => {
    dispatch(setInitialSesarState());
    console.log('Sesar credentials have beed reset');
    toast.show('Sesar credentials have beed reset', {type: 'success'});
    // handleIGSNChecked(false);
  };

  const onUserCodeSelect = async (userCode) => {
    dispatch(setSelectedUserCode(userCode));
  };

  /* Logic Helpers */

  const closePicker = () => {
    setIsPickerVisible(false);
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
      else if (tokens.errors.permissions) {
        throw Error(tokens.errors.permissions + ' Please check your ORCID login credentials');
      }
    }
    catch (err) {
      console.error(err);
      alert(err.toString());
    }
  };

  const openPicker = () => {
    setIsPickerVisible(true);
  };

  const orcidAuthentication = async () => {
    await getOrcidToken();
  };

  /* Render Functions */

  const renderIGSNUploadCheckbox = () => {
    return (
      <View style={{justifyContent: 'flex-start', alignItems: 'center'}}>
        {!selectedFeature.isOnMySesar && (
          <>
            <Text style={sampleStyles.mySesarUpdateDisclaimer}>
              To upload to your SESAR account and obtain an IGSN check below:
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <CheckBox
                checked={isIGSNChecked}
                disabled={!isInternetReachable}
                onPress={handlePress}
                title={'Upload to SESAR'}
              />
              {isIGSNChecked && isEmpty(selectedUserCode) && !selectedFeature.isOnMySesar && (
                <Icon
                  color={WARNING_COLOR}
                  name={'warning-outline'}
                  onPress={() => alert('SESAR Code Required')}
                  reverse
                  size={10}
                  type={'ionicon'}
                />
              )}
            </View>
          </>
        )}

      </View>
    );
  };

  const renderIGSNUserCodePicker = () => {
    return (
      <View style={{padding: 10, marginLeft: 20}}>
        {/*{!isEmpty(userCodes)*/}
        {/*  && (*/}
        {selectedFeature.Sample_IGSN ? (
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            {/*<Text style={{fontSize: MEDIUM_TEXT_SIZE, marginRight: 20}}>*/}
            {/*  SESAR User Code: {selectedFeature.sesarUserCode}*/}
            {/*</Text>*/}
          </View>
        ) : (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <Text style={{fontSize: MEDIUM_TEXT_SIZE, marginRight: 20}}>SESAR User Code:</Text>
              <Button
                disabled={selectedFeature.isOnMySesar}
                disabledTitleStyle={{color: BLACK}}
                icon={{
                  containerStyle: {paddingLeft: 5},
                  name: 'chevron-down-outline',
                  type: 'ionicon',
                }}
                iconRight
                onPress={openPicker}
                raised
                title={selectedUserCode || 'Select User Code'}
                titleStyle={{fontSize: MEDIUM_TEXT_SIZE, color: BLACK}}
                type={'outline'}
              />
            </View>
            <PickerOverlay
              closePicker={closePicker}
              data={[...userCodes, undefined]}
              dividerText={'Select User Code'}
              isPickerVisible={isPickerVisible}
              onSelect={onUserCodeSelect}
              value={selectedUserCode}
            />
          </>
        )}
      </View>
    );
  };

  const renderOrcidSignInButton = () => (
    <View style={{justifyContent: 'flex-start', alignItems: 'center', padding: 20}}>
      <OutlineButton onPress={orcidAuthentication} title={'Sign into MySESAR'}/>
      <Text style={sampleStyles.mySesarUpdateDisclaimer}>
        ⚠️ Authenticate your SESAR account to upload a sample.
      </Text>
    </View>
  );

  const renderSesarUploadDisclosure = () => {
    if (!isInternetReachable) {
      return (
        <View style={{padding: 10}}>
          <Text style={sampleStyles.mySesarUpdateDisclaimer}>This sample has already been registered in your MYSESAR
            account with an IGSN number and needs to sync. You will need to be online make any updates.</Text>
        </View>
      );
    }
    else {
      return (
        <View style={{padding: 10}}>
          <Text style={sampleStyles.mySesarUpdateDisclaimer}>This sample has already been registered in your MYSESAR
            account. Any changes will be automatically updated.</Text>
        </View>
      );
    }
  };

  /* View */

  return (
    <>
      <View>
        {selectedFeature?.isOnMySesar && renderSesarUploadDisclosure()}
        {renderIGSNUploadCheckbox()}
        {isIGSNChecked && (
          <View>
            {isEmpty(sesarToken?.access) && renderOrcidSignInButton()}
            {!isEmpty(sesarToken?.access) && renderIGSNUserCodePicker()}
            {!isEmpty(sesarToken?.access) && <ClearButton onPress={onReset} title={'Reset SESAR Credentials'}/>}
          </View>
        )}
      </View>
    </>
  );
};

export default IGSNUploadAndRegister;
