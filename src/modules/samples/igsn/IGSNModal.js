import React, {forwardRef, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import IGSNModalStyles from './IGSNModal.styles';
import useIGSN from './useIGSN';
import SesarLogo from '../../../assets/images/logos/sesar2_logo.png';
import {isEmpty} from '../../../shared/helpers';
import Loading from '../../../shared/ui/Loading';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {updatedKey} from '../../user/userProfile.slice';

const IGSNModal = forwardRef(({
                                isVisible,
                                onModalCancel,
                                onSampleSaved,
                                sampleValues,
                              }, formRef) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {sesar} = useSelector(state => state.user);

  const {straboSesarMapping, updateSampleIsSesar, uploadSample} = useIGSN();

  /* Local State */
  const [errorMessages, setErrorMessages] = useState([]);
  const [errorView, setErrorView] = useState(false);
  const [igsnResult, setIgsnResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [mappedSesarValues, setMappedSesarValues] = useState({});
  const [modalPage, setModalPage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  /* Derived Variables */

  const formValues = sampleValues || formRef.current?.values || {};

  /* Side Effects */

  useEffect(() => {
    setStatusMessage('Below are the valid relevant fields in your MYSESAR account.');
    // const sesarUserCode = !formRef.current.values.isOnMySesar ? sesar.selectedUserCode : formRef.current.values.sesarUserCode;
    // formRef.current.setValues({...formRef.current.values, sesarUserCode: sesarUserCode}).then(
    //   () => console.log('FORMREF.CURRENT.VALUES', formRef.current.values));
    console.log('FORM VALUES', formValues);
    const sesarMappedObj = straboSesarMapping(formValues);
    setMappedSesarValues(sesarMappedObj);

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
  }, [formValues, sesar]);

  /* Event Handlers */

  const handleConfirmOnPress = () => {
    onSampleSaved({...sampleValues, ...igsnResult});
    onModalCancel();
  };

  const handleModalClose = () => {
    setErrorView(false);
    setIsUploaded(false);
    setIgsnResult(null);
    setModalPage(null);
    setStatusMessage('');
    onModalCancel();
  };
  /* Logic Helpers */

  // SESAR requires sample_type and material to register/update a sample. Detect from the raw form
  // values — the mapped display value is unreliable (getLabel returns 'Unknown' for an empty type).
  const missingRequiredFields = {
    material: isEmpty(formValues?.material_type),
    sample_type: isEmpty(formValues?.sample_type),
  };

  const isActionDisabled = (!formValues?.isOnMySesar && isEmpty(sesar.selectedUserCode))
    || missingRequiredFields.sample_type || missingRequiredFields.material;

  const registerSample = async () => {
    try {
      const currentFormValues = sampleValues || formRef.current?.values || {};
      console.log('Updated FormRef', formRef.current?.values);
      setIsLoading(true);
      const res = currentFormValues.isOnMySesar ? await updateSampleIsSesar(mappedSesarValues)
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
        setIgsnResult({Sample_IGSN: res.igsn, isOnMySesar: true});
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

  const setPage = () => {
    switch (modalPage) {
      case 'error':
        return renderErrorView('error');
      default:
        return renderUploadContent();
    }
  };

  /* Render Functions */

  const renderContentItems = () => {
    // const sesarMappedObj = straboSesarMapping(formRef.current?.values || {});
    return (
      <View style={{
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        {!isUploaded && isActionDisabled
          ? renderRequiredFieldsWarning()
          : <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>}
        {!isUploaded && isVisible && mappedSesarValues.map((item) => {
          if (item.sesarKey === 'user_code' && formValues?.isOnMySesar) return null;
          if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;
          return (
            <View key={item.sesarKey}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingLeft: 20,
                  }}>
              <Text style={IGSNModalStyles.uploadContentText}>{item.label}</Text>
              <Text style={IGSNModalStyles.fieldValueText}> {formatContentItems(item)}</Text>
            </View>
          );
        })
        }
      </View>
    );
  };

  const renderRequiredFieldsWarning = () => {
    const missingLabels = [
      missingRequiredFields.sample_type && 'Sample Type',
      missingRequiredFields.material && 'Material',
    ].filter(Boolean);
    const isMissingUserCode = !formValues?.isOnMySesar && isEmpty(sesar.selectedUserCode);
    if (isEmpty(missingLabels) && !isMissingUserCode) return null;
    return (
      <>
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

  const renderErrorView = () => {
    return (
      <View style={IGSNModalStyles.errorContainer}>
        <Text style={IGSNModalStyles.headerText}>There was a error!</Text>
        {errorMessages.map(msg => <Text style={IGSNModalStyles.errorMessageText}>{msg}</Text>)}
      </View>
    );
  };

  const renderUploadContent = () => {
    return (
      <>
        {!isEmpty(formValues?.sample_id_name) && (
          <ScrollView>
            {renderContentItems()}
          </ScrollView>
        )}
      </>
    );
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={errorView ? 'Close' : (!isUploaded ? 'Register' : 'OK')}
      disabled={isActionDisabled}
      isLoading={isLoading}
      isVisible={isVisible}
      onActionPressed={errorView ? handleModalClose : (!isUploaded ? registerSample : handleConfirmOnPress)}
      onCancelPress={onModalCancel}
      overlayStyleOverride={{
        flex: 1,
        maxHeight: isUploaded || errorView ? '40%' : '80%',
        width: 500,
      }}
      showActionButton={errorView || (!isEmpty(formValues?.sample_id_name) && !isLoading)}
      showCancelButton={!isLoading && !isUploaded && !errorView}
    >
      <View style={IGSNModalStyles.container}>
        <View style={IGSNModalStyles.sesarImageContainer}>
          <Image
            source={SesarLogo}
            style={IGSNModalStyles.sesarImage}
          />
        </View>
        {setPage()}
      </View>
      <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
    </ModalWrapper>
  );
});

export default IGSNModal;
