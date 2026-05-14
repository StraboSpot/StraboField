import React, {forwardRef, useEffect, useState} from 'react';
import {Linking, ScrollView, Text, View} from 'react-native';

import {Icon, Image} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import IGSNModalStyles from './IGSNModal.styles';
import IGSNUploadAndRegister from './IGSNUploadAndRegister';
import useIGSN from './useIGSN';
import SesarLogo from '../../../assets/images/logos/sesar2_logo.png';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import Loading from '../../../shared/ui/Loading';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import PickerOverlay from '../../../shared/ui/modals/PickerOverlay';
import {setLoadingStatus} from '../../home/home.slice';
import {editedSpotProperties} from '../../spots/spots.slice';
import {
  setInitialSesarState,
  setSelectedUserCode,
  setSesarToken,
  setSesarUserCodes,
  updatedKey,
} from '../../user/userProfile.slice';

const IGSNModal = forwardRef(({
                                isVisible,
                                onIGSNUpdated,
                                onModalCancel,
                                onSampleSaved,
                              }, formRef) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {
    authenticateWithSesar,
    getAndSaveSesarCode,
    straboSesarMapping,
    updateSampleIsSesar,
    uploadSample,
  } = useIGSN();
  const {getOrcidToken, getSesarToken} = useServerRequests();
  const toast = useToast();

  const {sesar} = useSelector(state => state.user);
  const {selectedAttributes} = useSelector(state => state.spot) || {};
  const spot = useSelector(state => state.spot.selectedSpot) || {};

  /* Local State */

  let formValues = formRef?.current?.values || selectedAttributes?.[0];
  // let currentFormValues = formRef?.current?.values || {};

  const [assignedIgsn, setAssignedIgsn] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [errorView, setErrorView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [mappedSesarValues, setMappedSesarValues] = useState([]);
  const [modalPage, setModalPage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  /* Side Effects */

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleOpenURL);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!sesar) {
      dispatch(updatedKey({
        sesar: {
          selectedUserCode: '',
          userCodes: [],
          sesarToken: {
            access: '',
            refresh: '',
          },
        },
      }));
    }

    console.log('FORM VALUES', formValues);
    if (isEmpty(sesar.sesarToken?.access)) setModalPage('login');
    else {
      setStatusMessage('Below are the valid relevant fields in your MYSESAR account.');
      setModalPage('content');
      const sesarMappedObj = formValues ? straboSesarMapping(formValues) : [];
      setMappedSesarValues(sesarMappedObj);

      console.log('User Codes', sesar.userCodes);
      console.log('Selected User Code', sesar.selectedUserCode);
    }
  }, [sesar.selectedUserCode, sesar.sesarToken?.access, formValues]);

  /* Event Handlers */

  const handleClose = () => {
    if (isUploaded && onIGSNUpdated) onIGSNUpdated();
    onModalCancel();
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

  const onReset = () => {
    dispatch(setInitialSesarState());
    console.log('Sesar credentials have beed reset');
    toast.show('Sesar credentials have beed reset', {type: 'success'});
  };

  /* Logic Helpers */

  const doShowActionButton = !isEmpty(sesar.sesarToken?.access)
    && !isLoading
    && !isUploaded
    && modalPage !== 'picker';

  const isActionDisabled = !formValues?.isOnMySesar && isEmpty(sesar.selectedUserCode);

  const getSesarTokenAndCodes = async (orcidToken) => {
    try {
      let tokens;
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
        const sesarCodesRes = await getAndSaveSesarCode(tokens);
        // Dispatch the full list of codes
        dispatch(setSesarUserCodes(sesarCodesRes.results.sesar_codes[0].sesar_code));
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

  const onUserCodeSelect = async (userCode) => {
    dispatch(setSelectedUserCode(userCode?.sesar_code || userCode));
    setIsPickerVisible(false);
  };

  const registerSample = async () => {
    try {
      console.log('Updated FormRef', formValues);
      setIsLoading(true);
      const res = formValues.isOnMySesar
        ? await updateSampleIsSesar(mappedSesarValues)
        : await uploadSample(mappedSesarValues);
      if (res.error && res.error.length > 0) {
        console.log(res.error[0]);
        setModalPage('error');
        setErrorMessages(res.error);
        setErrorView(true);
      }
      else {
        setIsUploaded(true);
        setStatusMessage(res.status);
        setAssignedIgsn(res.igsn || '');
        if (spot.properties.isSample) {
          let newSampleSpot = {};
          console.log('Is a sample', newSampleSpot);
          dispatch(editedSpotProperties({
            field: 'samples',
            value: [{
              ...spot.properties.samples[0],
              Sample_IGSN: res.igsn,
              isOnMySesar: true,
            }],
          }));
          console.log('Updated Sample Spot', spot.properties.samples[0]);
        }
        else if (formRef?.current) {
          await formRef?.current?.setValues({...formRef?.current.values, Sample_IGSN: res.igsn, isOnMySesar: true});
        }
        else if (selectedAttributes?.[0]) {
          const sampleId = selectedAttributes[0].id;
          const updatedSamples = (spot.properties.samples || []).map(s =>
            s.id === sampleId ? {...s, Sample_IGSN: res.igsn, isOnMySesar: true} : s
          );
          dispatch(editedSpotProperties({field: 'samples', value: updatedSamples}));
        }
      }
      setIsLoading(false);
    }
    catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMessages(err || ['Something went wrong.']);
      setModalPage('error');
      setIsUploaded(false);
    }
  };

  /* Derived Variables */

  const isStatusView = isUploaded || modalPage === 'error';

  const getModalHeight = () => {
    if (modalPage === 'content' && !isStatusView) return '80%';
    return 'auto';
  };

  /* Render Functions */

  const renderLoginView = () => (
    <IGSNUploadAndRegister
      isIGSNChecked={true}
      selectedFeature={formValues}
    />
  );

  const renderContentView = () => (
    <ScrollView style={IGSNModalStyles.contentContainer}>
      <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
      {isVisible && mappedSesarValues?.map((item) => {
        if (item.sesarKey === 'user_code' && formRef?.current?.values?.isOnMySesar) return null;
        if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;

        return (
          <View key={item.sesarKey} style={IGSNModalStyles.fieldRow}>
            <View style={IGSNModalStyles.labelColumn}>
              <Text style={IGSNModalStyles.uploadContentText}>{item.label}</Text>
            </View>
            <View style={{
              ...IGSNModalStyles.valueColumn,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <Text style={IGSNModalStyles.fieldValueText}>{formatContentItems(item)}</Text>
              {item.sesarKey === 'user_code' && (
                <ClearButton
                  containerStyle={{width: '50%'}}
                  icon={
                    <Icon
                      color='#00aced'
                      name='pencil-outline'
                      type='ionicon'
                    />
                  }
                  onPress={() => setIsPickerVisible(true)}
                />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderStatusView = () => (
    <View style={isUploaded ? IGSNModalStyles.successContainer : IGSNModalStyles.errorContainer}>
      <Text style={IGSNModalStyles.statusHeaderText}>
        {isUploaded ? 'Success!' : 'There was an error!'}
      </Text>
      {isUploaded
        ? <Text style={IGSNModalStyles.statusMessageText}>{statusMessage}</Text>
        : errorMessages.map(msg => (
          <Text key={msg} style={IGSNModalStyles.statusMessageText}>{msg}</Text>
        ))
      }
    </View>
  );

  const renderCurrentView = () => {
    if (isStatusView) return renderStatusView();
    if (modalPage === 'login') return renderLoginView();
    if (modalPage === 'content') return renderContentView();
    return null;
  };

  return (
    <ModalWrapper
      actionTitle={formValues?.isOnMySesar ? 'Update' : 'Register'}
      cancelTitle={'Close'}
      closeModal={handleClose}
      disabled={isActionDisabled}
      isLoading={isLoading}
      isVisible={isVisible}
      onActionPressed={registerSample}
      onCancelPress={handleClose}
      overlayStyleOverride={{
        height: getModalHeight(),
        width: 400,
      }}
      showActionButton={doShowActionButton}
      showCancelButton={false}
      showCloseButton
    >
      <View style={IGSNModalStyles.container}>
        <View style={IGSNModalStyles.sesarImageContainer}>
          <Image
            source={SesarLogo}
            style={IGSNModalStyles.sesarImage}
          />
        </View>
        {renderCurrentView()}
        {!isEmpty(sesar.sesarToken?.access) && !isStatusView && (
          <ClearButton onPress={onReset} title={'Reset SESAR Credentials'}/>
        )}
      </View>
      <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
      <PickerOverlay
        closePicker={() => setIsPickerVisible(false)}
        data={[...sesar.userCodes.map(c => c?.sesar_code || c), undefined]}
        dividerText={'Select a User Code'}
        isPickerVisible={isPickerVisible}
        onSelect={onUserCodeSelect}
        value={sesar.selectedUserCode}
      />
    </ModalWrapper>
  );
});

export default IGSNModal;
