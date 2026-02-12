import React, {forwardRef, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Image} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import IGSNModalStyles from './IGSNModal.styles';
import useSamples from './useSamples';
import SesarLogo from '../../assets/images/logos/sesar2_logo.png';
import {isEmpty, truncateText} from '../../shared/Helpers';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {updatedKey} from '../user/userProfile.slice';

const IGSNModal = forwardRef(({
                                isVisible,
                                onModalCancel,
                                onSampleSaved,
                              }, formRef) => {

  const dispatch = useDispatch();
  const {straboSesarMapping, updateSampleIsSesar, uploadSample} = useSamples();

  const {sesar} = useSelector(state => state.user);

  const formValues = formRef.current?.values || {};
  const [errorMessages, setErrorMessages] = useState([]);
  const [errorView, setErrorView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [mappedSesarValues, setMappedSesarValues] = useState({});
  const [modalPage, setModalPage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

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

  const handleConfirmOnPress = () => {
    if (formRef.current) onSampleSaved(formRef.current);
    onModalCancel();
  };

  const registerSample = async () => {
    try {
      const formValues = formRef.current?.values || {};
      console.log('Updated FormRef', formRef.current?.values);
      setIsLoading(true);
      const res = formValues.isOnMySesar ? await updateSampleIsSesar(mappedSesarValues) : await uploadSample(
        mappedSesarValues);
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

  const isoToLocalDateTime = (isoString, type) => {
    const date = new Date(isoString);
    const timeAndDate = type === 'time' ? date.toLocaleTimeString('en-US') : date.toLocaleDateString('en-US');
    return timeAndDate;
  };

  const setPage = () => {
    if (modalPage === 'error') return renderErrorView();
    return renderUploadContent();
  };

  const renderErrorView = () => {
    return (
      <View style={IGSNModalStyles.errorContainer}>
        <Text style={IGSNModalStyles.headerText}>There was a error!</Text>
        {errorMessages.map(msg => <Text style={IGSNModalStyles.errorMessageText}>{msg}</Text>)}
      </View>
    );
  };

  const formatContentItems = (item) => {
    if (item.sesarKey === 'longitude' || item.sesarKey === 'latitude'
      || item.sesarKey === 'longitude_end' || item.sesarKey === 'latitude_end') {
      return item.value;
    }
    if (item.sesarKey === 'collection_start_date') {
      return moment(item.value).format('MM-DD-YYYY (h:mm:ss a)');
      // return isoToLocalDateTime(item.value);
    }
    if (item.sesarKey === 'collection_time') {
      return isoToLocalDateTime(item.value, 'time');
    }
    if (item.sesarKey === 'description') return truncateText(item.value, 30);
    return item.value;
  };

  const renderContentItems = () => {
    // const sesarMappedObj = straboSesarMapping(formRef.current?.values || {});
    return (
      <View style={{
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
        {!isUploaded && isVisible && mappedSesarValues.map((item) => {
          if (item.sesarKey === 'user_code' && formRef.current?.values?.isOnMySesar) return null;
          if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;
          return (
            <View key={item.sesarKey}
                  style={{
                    alignItems: 'center',
                    flexDirection: 'row',
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

  const renderUploadContent = () => {
    if (isEmpty(formRef.current?.values?.sample_id_name)) return null;
    return (
      <ScrollView>
        {renderContentItems()}
      </ScrollView>
    );
  };

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
        {setPage()}
      </View>
      <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
    </ModalWrapper>
  );
});

export default IGSNModal;
