import React, {forwardRef, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import IGSNModalStyles from './IGSNModal.styles';
import useIGSN from './useIGSN';
import SesarLogo from '../../../assets/images/logos/sesar2_logo.png';
import {isEmpty} from '../../../shared/Helpers';
import Loading from '../../../shared/ui/Loading';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {updatedKey} from '../../user/userProfile.slice';

const IGSNModal = forwardRef(({
                                isVisible,
                                onModalCancel,
                                onSampleSaved,
                              }, formRef) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {sesar} = useSelector(state => state.user);

  const {straboSesarMapping, updateSampleIsSesar, uploadSample} = useIGSN();

  /* Local State */
  const [errorMessages, setErrorMessages] = useState([]);
  const [errorView, setErrorView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [mappedSesarValues, setMappedSesarValues] = useState({});
  const [modalPage, setModalPage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  /* Derived Variables */

  const formValues = formRef.current?.values || {};

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
    if (formRef.current) onSampleSaved(formRef.current);
    onModalCancel();
  };

  /* Logic Helpers */

  const registerSample = async () => {
    try {
      const currentFormValues = formRef.current?.values || {};
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
        await formRef.current?.setValues({...formRef.current.values, Sample_IGSN: res.igsn, isOnMySesar: true});
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
    if (modalPage === 'error') return renderErrorView();
    return renderUploadContent();
  };

  /* Render Functions */

  const renderContentItems = () => {
    return (
      <View style={IGSNModalStyles.contentContainer}>

        {!isUploaded && isVisible && mappedSesarValues.map((item) => {
          if (item.sesarKey === 'user_code' && formRef.current?.values?.isOnMySesar) return null;
          if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;

          return (
            <View key={item.sesarKey} style={IGSNModalStyles.fieldRow}>
              <View style={IGSNModalStyles.labelColumn}>
                <Text style={IGSNModalStyles.uploadContentText}>{item.label}</Text>
              </View>
              <View style={IGSNModalStyles.valueColumn}>
                <Text style={IGSNModalStyles.fieldValueText}>{formatContentItems(item)}</Text>
              </View>
            </View>
          );
        })}
      </View>
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
    if (isEmpty(formRef.current?.values?.sample_id_name)) return null;
    return (
      <ScrollView>
        {renderContentItems()}
      </ScrollView>
    );
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={!isUploaded ? 'Register' : 'OK'}
      isLoading={isLoading}
      isVisible={isVisible}
      onActionPressed={!isUploaded ? registerSample : handleConfirmOnPress}
      onCancelPress={onModalCancel}
      overlayStyleOverride={{
        flex: 1,
        maxHeight: isUploaded || errorView ? '40%' : '80%',
        width: 500,
      }}
      showActionButton={!isEmpty(formRef.current?.values?.sample_id_name) && !isLoading}
      showCancelButton={!isLoading && !isUploaded}
    >
      <View style={IGSNModalStyles.container}>
        <View style={IGSNModalStyles.sesarImageContainer}>
          <Image
            source={SesarLogo}
            style={IGSNModalStyles.sesarImage}
          />
        </View>
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
        {setPage()}
      </View>
      <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
    </ModalWrapper>
  );
});

export default IGSNModal;
