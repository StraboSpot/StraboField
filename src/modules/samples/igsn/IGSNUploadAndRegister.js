import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import igsnStyles from './igsn.styles';
import useIGSN from './useIGSN';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import {BLACK, MEDIUM_TEXT_SIZE} from '../../../shared/styles.constants';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import PickerOverlay from '../../../shared/ui/modals/PickerOverlay';
import {setLoadingStatus} from '../../home/home.slice';
import {
  setInitialSesarState,
  setSelectedUserCode,
  setSesarToken,
  setSesarUserCodes,
} from '../../user/userProfile.slice';

const IGSNUploadAndRegister = ({handleIGSNChecked, isIGSNChecked, selectedFeature}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);
  const {userCodes, selectedUserCode, sesarToken} = useSelector(state => state.user?.sesar || {});
  const {isSample} = useSelector(state => state.spot.selectedSpot.properties) || {};

  const {authenticateWithSesar, getAndSaveSesarCode} = useIGSN();
  const {getOrcidToken, getSesarToken} = useServerRequests();
  const toast = useToast();

  /* Local State */
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  /* Derived Variables */

  let tokens = sesarToken;

  /* Side Effects */

  useEffect(() => {
    console.log('In 1st UE in IGSNUploadAndRegister page');
    isIGSNChecked && !isEmpty(sesarToken?.access) && getSesarTokenAndCodes()
      .catch(err => console.log(err));
  }, [isIGSNChecked]);

  /* Event Handlers */

  const onReset = () => {
    dispatch(setInitialSesarState());
    console.log('Sesar credentials have beed reset');
    toast.show('Sesar credentials have beed reset', {type: 'success'});
  };

  const onUserCodeSelect = async (userCode) => {
    dispatch(setSelectedUserCode(userCode?.sesar_code || userCode));
    closePicker();
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
        tokens = await authenticateWithSesar(tokens);
        const sesarMessage = tokens.access ? 'SESAR Authenticated!' : 'SESAR NOT Authenticated!';
        toast.show(sesarMessage, {
          duration: 3000,
          placement: 'bottom',
          textStyle: {fontSize: 20, fontStyle: 'italic'},
          type: tokens.access ? 'success' : 'danger',
        });
        if (!selectedFeature.isOnMySesar) {
          const sesarCodesRes = await getAndSaveSesarCode(tokens);
          dispatch(setSesarUserCodes(sesarCodesRes.results.sesar_codes[0].sesar_code));
        }
        dispatch(setLoadingStatus({view: 'home', bool: false}));
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

  const renderIGSNUserCodePicker = () => {
    return (
      <View style={{marginLeft: 20, padding: 10}}>
        {selectedFeature?.Sample_IGSN ? (
          <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'center'}}>
            {/*<Text style={{fontSize: MEDIUM_TEXT_SIZE, marginRight: 20}}>*/}
            {/*  SESAR User Code: {selectedFeature.sesarUserCode}*/}
            {/*</Text>*/}
          </View>
        ) : (
          <>
            <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-start'}}>
              <Text style={{fontSize: MEDIUM_TEXT_SIZE, marginRight: 20}}>SESAR User Code:</Text>
              <Button
                disabled={selectedFeature?.isOnMySesar}
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
                titleStyle={{color: BLACK, fontSize: MEDIUM_TEXT_SIZE}}
                type={'outline'}
              />
            </View>
            <PickerOverlay
              closePicker={closePicker}
              data={[...userCodes.map(c => c?.sesar_code || c), undefined]}
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
    <View style={{alignItems: 'center', justifyContent: 'flex-start', padding: 20}}>
      <OutlineButton onPress={orcidAuthentication} title={'Sign into MySESAR'}/>
      <Text style={igsnStyles.mySesarUpdateDisclaimer}>
        ⚠️ Authenticate your SESAR account to upload a sample.
      </Text>
    </View>
  );

  const renderSesarUploadDisclosure = () => {
    const message = !isInternetReachable
      ? 'This sample has already been registered in your MYSESAR account with an IGSN number and needs to sync. You will need to be online make any updates.'
      : 'This sample has already been registered in your MYSESAR account. Any changes will be automatically updated.';
    return (
      <View style={{padding: 10}}>
        <Text style={igsnStyles.mySesarUpdateDisclaimer}>{message}</Text>
      </View>
    );
  };

  /* View */

  return (
    <View>
      {selectedFeature?.isOnMySesar && renderSesarUploadDisclosure()}
      {isIGSNChecked && (
        <View>
          {isEmpty(sesarToken?.access) && renderOrcidSignInButton()}
          {!isEmpty(sesarToken?.access) && renderIGSNUserCodePicker()}
          {!isSample && !isEmpty(sesarToken?.access)
            && <ClearButton onPress={onReset} title={'Reset SESAR Credentials'}/>}
        </View>
      )}
    </View>
  );
};

export default IGSNUploadAndRegister;
