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

const IGNSModal = forwardRef(({
                                isVisible,
                                sampleValues,
                                onModalCancel,
                                onSampleSaved,
                              }, formRef) => {

  const dispatch = useDispatch();
  const {
    straboSesarMapping,
    updateSampleIsSesar,
    uploadSample,
  } = useSamples();
  const {sesar} = useSelector(state => state.user);

  const [commonFields, setCommonFields] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [checkSesarAuth, setCheckSesarAuth] = useState(true);
  const [errorView, setErrorView] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [modalPage, setModalPage] = useState(null);

  useEffect(() => {
    setStatusMessage('Below are the valid relevant fields in your MYSESAR account.');
    // const sesarUserCode = !formRef.current.values.isOnMySesar ? sesar.selectedUserCode : formRef.current.values.sesarUserCode;
    // formRef.current.setValues({...formRef.current.values, sesarUserCode: sesarUserCode}).then(
    //   () => console.log('FORMREF.CURRENT.VALUES', formRef.current.values));

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
  }, []);

  const handleConfirmOnPress = () => {
    if (formRef.current) onSampleSaved(formRef.current);
    onModalCancel();
  };

  const registerSample = async () => {
    try {
      const formValues = formRef.current?.values || {};
      console.log('Updated FormRef', formRef.current?.values);
      setIsLoading(true);
      const res = formValues.isOnMySesar ? await updateSampleIsSesar(formValues) : await uploadSample(formValues);
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
      setErrorMessages('Something went wrong.');
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
    switch (modalPage) {
      case 'error':
        return renderErrorView('error');
      default:
        return renderUploadContent();
    }
  };

  const renderErrorView = () => {
    return (
      <View style={IGSNModalStyles.errorContainer}>
        <Text style={IGSNModalStyles.headerText}>There was a error!</Text>
        {errorMessages.map((msg, index) => <Text style={IGSNModalStyles.errorMessageText}>{msg}</Text>)}
      </View>
    );
  };

  const formatContentItems = (item) => {
    if (item.sesarKey === 'longitude' || item.sesarKey === 'latitude') {
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
    else return item.value;
  };

  const renderContentItems = () => {
    const sesarMappedObj = straboSesarMapping(formRef.current?.values || {});
    return (
      <View style={{
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}>
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
        {!isUploaded && sesarMappedObj.map((item) => {
          if (item.sesarKey === 'user_code' && formRef.current?.values?.isOnMySesar) return null;
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

  const renderUploadContent = () => {
    return (
      <>
        {!isEmpty(formRef.current?.values?.sample_id_name) && (
          <ScrollView>
            {renderContentItems()}
          </ScrollView>
        )}
      </>
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

export default IGNSModal;
