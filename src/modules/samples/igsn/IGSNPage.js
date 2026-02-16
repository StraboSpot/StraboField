import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import moment from 'moment/moment';
import {useDispatch, useSelector} from 'react-redux';

import IGSNModalStyles from './IGSNModal.styles';
import {isEmpty} from '../../../shared/Helpers';
import PageHeader from '../../page/PageHeader';
import useSamples from '../useSamples';


const IGSNPage = (props) => {
  const dispatch = useDispatch();
  const {straboSesarMapping} = useSamples();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [statusMessage, setStatusMessage] = useState('');
  const [mappedSesarValues, setMappedSesarValues] = useState({});

  useEffect(() => {
    const sesarMappedObj = straboSesarMapping(spot.properties.samples[0] || {});
    console.log('sesarMappedObj', sesarMappedObj);
    setMappedSesarValues(sesarMappedObj);
  }, []);

  const isoToLocalDateTime = (isoString, type) => {
    const date = new Date(isoString);
    const timeAndDate = type === 'time' ? date.toLocaleTimeString('en-US') : date.toLocaleDateString('en-US');
    return timeAndDate;
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
    // if (item.sesarKey === 'description') return truncateText(item.value, 300);
    return item.value;
  };

  const renderContentItems = () => {
    return (
      <ScrollView style={IGSNModalStyles.contentContainer}>
        <Text style={IGSNModalStyles.uploadContentDescription}>{statusMessage}</Text>
        {!isEmpty(mappedSesarValues) && mappedSesarValues.map((item) => {
          if (item.sesarKey === 'user_code' && spot.properties.samples[0].isOnMySesar) return null;
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
      </ScrollView>
    );
  };

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'IGSN'}/>
      <Text style={{textAlign: 'center', marginTop: 10, fontWeight: '600', fontSize: 18}}>Recorded IGSN Metadata on
        SESAR</Text>
      {/*<Image source={require('../../../assets/images/logos/IGSN_Logo_200.jpg')} style={{width: 200, height: 200}}/>*/}
      {renderContentItems()}
    </View>
  );
};

export default IGSNPage;
