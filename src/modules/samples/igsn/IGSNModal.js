import React, {forwardRef, useEffect, useState} from 'react';
import {ActivityIndicator, Linking, ScrollView, Text, View} from 'react-native';

import {Icon, Image} from '@rn-vui/base';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import IGSNModalStyles from './IGSNModal.styles';
import IGSNUploadAndRegister from './IGSNUploadAndRegister';
import useIGSN from './useIGSN';
import SesarLogo from '../../../assets/images/logos/sesar2_logo.png';
import useUpload from '../../../services/files/useUpload';
import useServerRequests from '../../../services/network/useServerRequests';
import {isEmpty} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import PickerOverlay from '../../../shared/ui/modals/PickerOverlay';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {setLoadingStatus} from '../../home/home.slice';
import {editedSpotProperties} from '../../spots/spots.slice';
import {
  setInitialSesarState,
  setSelectedUserCode,
  setSesarToken,
  setSesarUserCodes,
  updatedKey,
} from '../../user/userProfile.slice';

const StepRow = ({label, status}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (status === 'done' || status === 'error') {
      scale.value = withSpring(1, {damping: 12, stiffness: 200});
      opacity.value = withSpring(1, {damping: 15, stiffness: 150});
    }
    else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [status]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={IGSNModalStyles.stepRow}>
      <Text style={IGSNModalStyles.stepLabel}>{label}</Text>
      <View style={IGSNModalStyles.stepIconContainer}>
        {status === 'loading' && <ActivityIndicator color='#007AFF' size='small'/>}
        {(status === 'done' || status === 'error') && (
          <Animated.View style={animatedStyle}>
            <Icon
              color={status === 'done' ? '#34C759' : '#FF3B30'}
              name={status === 'done' ? 'checkmark-circle' : 'close-circle'}
              size={24}
              type='ionicon'
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const IGSNModal = forwardRef(({
                                isVisible,
                                onIGSNUpdated,
                                onModalCancel,
                                onSampleSaved,
                                sampleValues,
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
  const {initializeUpload} = useUpload();
  const {getSesarToken} = useServerRequests();
  const toast = useToast();

  const {sesar} = useSelector(state => state.user);
  const {isInternetReachable} = useSelector(state => state.connections.isOnline);
  const {selectedAttributes} = useSelector(state => state.spot) || {};
  const spot = useSelector(state => state.spot.selectedSpot) || {};

  /* Local State */

  let formValues = sampleValues || formRef?.current?.values || selectedAttributes?.[0];

  const [assignedIgsn, setAssignedIgsn] = useState('');
  const [errorMessages, setErrorMessages] = useState([]);
  const [errorView, setErrorView] = useState(false);
  const [igsnResult, setIgsnResult] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mappedSesarValues, setMappedSesarValues] = useState([]);
  const [modalPage, setModalPage] = useState(null);
  const [sesarStepLabel, setSesarStepLabel] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [stepStatuses, setStepStatuses] = useState({sesar: 'idle', upload: 'idle'});

  /* Derived Variables */

  // SESAR requires sample_type and material to register/update a sample. Detect from the raw form
  // values — the mapped display value is unreliable (getLabel returns 'Unknown' for an empty type).
  const missingRequiredFields = {
    material: isEmpty(formValues?.material_type),
    sample_type: isEmpty(formValues?.sample_type),
  };

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
  }, [isVisible, sesar.selectedUserCode, sesar.sesarToken?.access, formValues]);

  useEffect(() => {
    if (!isVisible) {
      setStepStatuses({sesar: 'idle', upload: 'idle'});
      setIsUploaded(false);
      setIsUploading(false);
      setAssignedIgsn('');
      setSesarStepLabel('');
      setStatusMessage('');
    }
  }, [isVisible]);

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
    console.log('SESAR credentials have beed reset');
    toast.show('SESAR credentials have been reset', {type: 'success'});
  };

  /* Logic Helpers */

  const doShowActionButton = isUploaded
    || (!isEmpty(sesar.sesarToken?.access) && !isUploading && modalPage !== 'picker');

  const isActionDisabled = !isInternetReachable
    || (!formValues?.isOnMySesar && isEmpty(sesar.selectedUserCode))
    || missingRequiredFields.sample_type || missingRequiredFields.material;

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
      setIsUploading(true);
      setStatusMessage('');
      setSesarStepLabel(formValues?.isOnMySesar ? 'Updating sample with SESAR' : 'Sending sample to SESAR');
      setStepStatuses({sesar: 'loading', upload: 'idle'});

      // Step 1: Register/update with SESAR
      const res = formValues.isOnMySesar
        ? await updateSampleIsSesar(mappedSesarValues)
        : await uploadSample(mappedSesarValues);
      if (res.error && res.error.length > 0) {
        console.log(res.error[0]);
        setStepStatuses({sesar: 'error', upload: 'idle'});
        setModalPage('error');
        setErrorMessages(res.error);
        setIsUploading(false);
        return;
      }

      setStatusMessage(formValues.isOnMySesar ? 'Sample updated with SESAR!' : 'Sample registered with SESAR!');
      setAssignedIgsn(res.igsn || '');
      setStepStatuses({sesar: 'done', upload: 'loading'});

      // Save sample + IGSN to Redux
      if (spot.properties.isSample) {
        dispatch(editedSpotProperties({
          field: 'samples',
          value: [{
            ...(formValues || spot.properties.samples?.[0]),
            Sample_IGSN: res.igsn,
            isOnMySesar: true,
          }],
        }));
      }
      else if (selectedAttributes?.[0]) {
        const sampleId = selectedAttributes[0].id;
        const updatedSamples = (spot.properties.samples || []).map(s =>
          s.id === sampleId ? {...s, ...formValues, Sample_IGSN: res.igsn, isOnMySesar: true} : s,
        );
        dispatch(editedSpotProperties({field: 'samples', value: updatedSamples}));
      }
      else if (sampleValues) {
        // Opened from the samples list — sampleValues is the raw sample object from the parent spot
        const sampleId = sampleValues.id ?? sampleValues.properties?.id;
        if (sampleId != null) {
          const updatedSamples = (spot.properties.samples || []).map(s =>
            s.id === sampleId ? {...s, Sample_IGSN: res.igsn, isOnMySesar: true} : s,
          );
          dispatch(editedSpotProperties({field: 'samples', value: updatedSamples}));
        }
      }

      // Step 3: Upload project to StraboSpot
      await initializeUpload();

      setStepStatuses({sesar: 'done', upload: 'done'});

      // Pause so the final checkmark spring is visible before Success! appears
      await new Promise(resolve => setTimeout(resolve, 400));

      setIsUploading(false);
      setIsUploaded(true);
    }
    catch (err) {
      console.error(err);
      setStepStatuses((prev) => {
        const failedKey = Object.keys(prev).find(k => prev[k] === 'loading') || 'upload';
        return {...prev, [failedKey]: 'error'};
      });
      setIsUploading(false);
      setErrorMessages([err?.message || 'Something went wrong.']);
      setModalPage('error');
    }
  };

  /* Derived Variables */

  const isStatusView = isUploaded || isUploading || modalPage === 'error';

  const steps = [
    {
      key: 'sesar',
      label: sesarStepLabel || (formValues?.isOnMySesar ? 'Updating sample with SESAR' : 'Sending sample to SESAR'),
    },
    {key: 'upload', label: 'Uploading project to StraboSpot'},
  ];

  const getModalHeight = () => {
    if (modalPage === 'content' && !isStatusView) return '80%';
    return 'auto';
  };

  const getHeaderTitle = () => {
    if (modalPage === 'error') return 'Upload Failed';
    if (isUploading) return 'Uploading Project';
    if (isUploaded) return 'Upload Complete!';
    return formValues?.isOnMySesar ? 'Update Sample with SESAR' : 'Register Sample with SESAR';
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
      {!isUploaded && isActionDisabled ? renderRequiredFieldsWarning() : (
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
      )}
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
                      color={'#00aced'}
                      name={'pencil-outline'}
                      type={'ionicon'}
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

  const renderRequiredFieldsWarning = () => {
    const missingLabels = [
      missingRequiredFields.sample_type && 'Sample Type',
      missingRequiredFields.material && 'Material',
    ].filter(Boolean);
    const isMissingUserCode = !formValues?.isOnMySesar && isEmpty(sesar.selectedUserCode);
    if (isInternetReachable && isEmpty(missingLabels) && !isMissingUserCode) return null;
    return (
      <>
        {!isInternetReachable && (
          <Text style={IGSNModalStyles.requiredLabel}>
            You must be connected to the Internet to register or update a sample with SESAR. Please reconnect and try
            again.
          </Text>
        )}
        {!isEmpty(missingLabels) && (
          <Text style={IGSNModalStyles.requiredLabel}>
            {missingLabels.join(' and ')} {missingLabels.length > 1 ? 'are' : 'is'} required to register a sample with
            SESAR. Please set {missingLabels.length > 1 ? 'these fields' : 'this field'} before registering.
          </Text>
        )}
        {isMissingUserCode && (
          <Text style={IGSNModalStyles.requiredLabel}>
            A SESAR user code is required to register a sample. Please select a user code in your MYSESAR account
            settings before registering.
          </Text>
        )}
      </>
    );
  };

  const renderStatusView = () => (
    <View
      style={[modalPage === 'error' ? IGSNModalStyles.errorContainer : IGSNModalStyles.successContainer, {alignSelf: 'stretch'}]}>
      {modalPage === 'error' && (
        <>
          <LottieAnimations doesLoop={false} type={'error'}/>
          <Text style={IGSNModalStyles.statusHeaderText}>There was an error!</Text>
          {errorMessages.map(msg => (
            <Text key={msg} style={IGSNModalStyles.statusMessageText}>{msg}</Text>
          ))}
        </>
      )}
      {(isUploading || isUploaded) && (
        <View style={IGSNModalStyles.stepsContainer}>
          {steps.map(step => (
            <StepRow key={step.key} label={step.label} status={stepStatuses[step.key]}/>
          ))}
        </View>
      )}
      {isUploaded && (
        <View style={IGSNModalStyles.successContainer}>
          <LottieAnimations doesLoop={false} type={'complete'}/>
          <Text style={IGSNModalStyles.statusHeaderText}>Success!</Text>
          {/*<Text style={IGSNModalStyles.statusMessageText}>{statusMessage}</Text>*/}
          {assignedIgsn ? (
            <Text style={IGSNModalStyles.statusMessageText}>IGSN: {assignedIgsn}</Text>
          ) : null}
        </View>
      )}
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
      actionTitle={modalPage === 'error' ? 'OK' : isUploaded ? 'Done' : formValues?.isOnMySesar ? 'Update' : 'Register'}
      cancelTitle={'Close'}
      closeModal={handleClose}
      disabled={modalPage === 'error' ? false : isActionDisabled}
      headerTitle={getHeaderTitle()}
      isLoading={isUploading}
      isVisible={isVisible}
      onActionPressed={modalPage === 'error' || isUploaded ? handleClose : registerSample}
      onCancelPress={handleClose}
      overlayStyleOverride={{
        height: getModalHeight(),
        width: 500,
      }}
      showActionButton={doShowActionButton}
      showCancelButton={false}
      showCloseButton
    >
      <View style={IGSNModalStyles.container}>
        {modalPage === 'content' && !isUploading && !isUploaded && <View style={IGSNModalStyles.sesarImageContainer}>
          <Image
            source={SesarLogo}
            style={IGSNModalStyles.sesarImage}
          />
        </View>}
        {renderCurrentView()}
        {!isEmpty(sesar.sesarToken?.access) && !isStatusView && (
          <ClearButton onPress={onReset} title={'Reset SESAR Credentials'}/>
        )}
      </View>
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
