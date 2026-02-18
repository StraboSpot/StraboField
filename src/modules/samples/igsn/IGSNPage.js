import React, {useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import IGSNModalStyles from './IGSNModal.styles';
import {isEmpty} from '../../../shared/Helpers';
import PageHeader from '../../page/PageHeader';
import useSamples from '../useSamples';


const IGSNPage = (props) => {
  /* Data Hooks */

  const spot = useSelector(state => state.spot.selectedSpot);

  const {straboSesarMapping} = useSamples();

  /* Local State */

  const [mappedSesarValues, setMappedSesarValues] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

  /* Side Effects */

  useEffect(() => {
    const sesarMappedObj = straboSesarMapping(spot.properties.samples[0] || {});
    console.log('sesarMappedObj', sesarMappedObj);
    setMappedSesarValues(sesarMappedObj);
  }, []);

  /* Render Functions */

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

  /* View */

  return (
    <View style={{flex: 1}}>
      <PageHeader pageTitle={'IGSN'}/>
      <Text style={{textAlign: 'center', marginTop: 10, fontWeight: '600', fontSize: 18}}>
        Recorded IGSN Metadata on SESAR
      </Text>
      {/*<Image source={require('../../../assets/images/logos/IGSN_Logo_200.jpg')} style={{width: 200, height: 200}}/>*/}
      {renderContentItems()}
    </View>
  );
};

export default IGSNPage;
