import React from 'react';
import {ScrollView, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {formatContentItems} from './igsn.helpers';
import igsnStyles from './igsn.styles';
import useIGSN from './useIGSN';
import {isEmpty} from '../../../shared/helpers';
import PageHeader from '../../page/PageHeader';

const IGSNPage = ({page}) => {
  /* Data Hooks */

  const spot = useSelector(state => state.spot.selectedSpot);

  const {straboSesarMapping} = useIGSN();

  /* Derived Variables */

  const mappedSesarValues = straboSesarMapping(spot.properties.samples[0] || {});

  /* Render Functions */

  const renderContentItems = () => {
    return (
      <ScrollView style={igsnStyles.contentContainer}>
        {mappedSesarValues.map((item) => {
          if (item.sesarKey === 'igsn' && isEmpty(item.value)) return null;

          return (
            <View key={item.sesarKey} style={igsnStyles.fieldRow}>
              <View style={igsnStyles.labelColumn}>
                <Text style={igsnStyles.labelText}>{item.label}</Text>
              </View>
              <View style={igsnStyles.valueColumn}>
                <Text style={igsnStyles.fieldValueText}>{formatContentItems(item)}</Text>
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
      <PageHeader pageTitle={page.label}/>
      <Text style={{textAlign: 'center', marginTop: 10, fontWeight: '600', fontSize: 18}}>
        Recorded IGSN Metadata on SESAR
      </Text>
      {renderContentItems()}
    </View>
  );
};

export default IGSNPage;
