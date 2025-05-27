import React, {useEffect, useState, forwardRef} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Button, Overlay, Image} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch, useSelector} from 'react-redux';

import IGSNModalStyles from './IGSNModal.styles';
import useSamples from './useSamples';
import SesarLogo from '../../assets/images/logos/sesar2_logo.png';
import {isEmpty, truncateText} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import Loading from '../../shared/ui/Loading';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import overlayStyles from '../home/overlays/overlay.styles';
import {updatedKey} from '../user/userProfile.slice';

const IGNSModal = forwardRef(({
                                sampleValues,
                                onModalCancel,
                                onSampleSaved,
                              }, formRef) => {

  const {height} = useWindowSize();

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
  const [errorMessage, setErrorMessage] = useState('');
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
    onSampleSaved(formRef.current);
    onModalCancel();
  };

  const registerSample = async () => {
    try {
      let res;
      console.log('Updated FormRef', formRef.current.values);
      setIsLoading(true);
      if (formRef.current.values.isOnMySesar) {
        setStatusMessage('Updating Sample...');
        console.log('UPDATING SESAR');
        res = await updateSampleIsSesar(formRef.current.values);
        setIsUploaded(true);
      }
      else {
        setStatusMessage('Uploading Sample...');
        res = await uploadSample(formRef.current.values);
        setIsUploaded(true);
      }
      setStatusMessage(res.status);
      setIsLoading(false);
      await formRef.current.setValues({...formRef.current.values, Sample_IGSN: res.igsn, isOnMySesar: true});
    }
    catch (err) {
      const errorMessage = err.toString().split(': ');
      const reformattedErrorMessage = errorMessage[1].replace(/^_*(.)|_+(.)/g,
        (s, c, d) => c ? c.toUpperCase() : ' ' + d.toUpperCase());
      setIsLoading(false);
      console.error(errorMessage);
      setErrorMessage(reformattedErrorMessage);
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
        <Text style={IGSNModalStyles.errorMessageText}>{errorMessage}</Text>
        <Button
          title={'Ok'}
          onPress={onModalCancel}
          buttonStyle={{backgroundColor: 'rgb(78, 114, 33)', paddingHorizontal: 50}}
        />
      </View>
    );
  };

  const formatContentItems = (item) => {
    if (item.sesarKey === 'longitude' || item.sesarKey === 'latitude') {
      return item.value.toFixed(5);
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
    const sesarMappedObj = straboSesarMapping(formRef.current.values);
    return (
      <>
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
        {!isUploaded && sesarMappedObj.map((item) => {
          if (item.sesarKey === 'user_code' && formRef.current.values.isOnMySesar) return null;
          if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;
          return (
            <View key={item.sesarKey}
                  style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Text style={IGSNModalStyles.uploadContentText}>{item.label}</Text>
              <Text style={IGSNModalStyles.fieldValueText}> {formatContentItems(item)}</Text>
            </View>
          );
        })
        }
      </>
    );
  };

  const renderUploadContent = () => {
    return (
      <>
        {!isEmpty(formRef.current.values.sample_id_name) && (
          <ScrollView>
            <View style={{marginLeft: 30}}>
              <View style={{alignItems: 'flex-start'}}>
                {renderContentItems()}
              </View>
            </View>
          </ScrollView>
        )}
        <Button
          onPress={!isUploaded ? registerSample : handleConfirmOnPress}
          title={!isUploaded ? 'Register' : 'OK'}
          containerStyle={{padding: 10}}
          buttonStyle={{backgroundColor: 'black', padding: 10}}
        />
      </>
    );
  };

  return (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      overlayStyle={SMALL_SCREEN ? overlayStyles.overlayContainerFullScreen : {
        ...overlayStyles.overlayContainer,
        maxHeight: height * 0.80, width: 500,
      }}
      animationType={'fade'}
    >
      <View style={IGSNModalStyles.container}>
        {!isUploaded && <Button
          title={'X'}
          type={'clear'}
          titleStyle={{color: 'black'}}
          containerStyle={{alignItems: 'flex-end', width: '100%'}}
          onPress={onModalCancel}
        />}
        <View style={IGSNModalStyles.sesarImageContainer}>
          <Image
            source={SesarLogo}
            style={IGSNModalStyles.sesarImage}
          />
        </View>
        {setPage()}
      </View>
      <Loading isLoading={isLoading} style={{backgroundColor: 'transparent'}}/>
    </Overlay>
  );
});

export default IGNSModal;
