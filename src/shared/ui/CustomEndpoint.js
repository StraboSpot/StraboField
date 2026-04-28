import React from 'react';
import {Text, View} from 'react-native';

import {Input} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SwitchWrapper} from '.';
import uiStyles from './ui.styles';
import {setCustomDatabaseUrl, setDatabaseIsSelected} from '../../modules/connections/connections.slice';
import {updateCustomMap} from '../../modules/maps/maps.slice';
import useMap from '../../modules/maps/useMap';
import {STRABO_APIS} from '../../services/network/urls.constants';

const CustomEndpoint = ({containerStyles, textStyles}) => {
    /* Data Hooks */

    const dispatch = useDispatch();
    const customMaps = useSelector(state => state.map.customMaps);
    const {endpoint, isSelected} = useSelector(state => state.connections.databaseEndpoint);

    const {setBasemap} = useMap();

    /* Event Handlers */

    const handleEndpointSwitchValue = async (value) => {
      Object.values(customMaps).map(map => map.isViewable && dispatch(updateCustomMap({...map, isViewable: false})));
      await setBasemap();
      if (!value) dispatch(setCustomDatabaseUrl(STRABO_APIS.DB));
      dispatch(setDatabaseIsSelected(value));
    };

    const handleEndpointTextValues = (endpointURLLocal) => {
      dispatch(setCustomDatabaseUrl(endpointURLLocal));
      console.log('Endpoint dispatched', endpointURLLocal);
    };

    /* View */

    return (
      <View style={[uiStyles.customEndpointContainer, containerStyles]}>
        <View style={uiStyles.customEndpointSwitchContainer}>
          <Text style={[uiStyles.customEndpointText, textStyles]}>Use Custom Database Endpoint?</Text>
          <SwitchWrapper onValueChange={handleEndpointSwitchValue} value={isSelected}/>
        </View>
        {isSelected && (
          <View style={uiStyles.customEndpointVerifyInputContainer}>
            <Input
              autoCapitalize={'none'}
              containerStyle={uiStyles.customEndpointInputContainer}
              defaultValue={endpoint}
              inputContainerStyle={{borderBottomWidth: 0}}
              inputStyle={uiStyles.customEndpointInput}
              label={'Enter endpoint IP address'}
              labelStyle={{fontSize: 10}}
              onChangeText={value => handleEndpointTextValues(value)}
              placeholder={'http://192.168.xxx/db'}
              returnKeyType={'send'}
            />
            <Text style={[uiStyles.customEndpointText, {fontStyle: 'italic'}, textStyles]}>
              *If using StraboSpot Offline make sure that the endpoint address contains
              <Text style={{fontWeight: 'bold'}}> &ldquo;http://&ldquo; and a trailing &ldquo;/db&ldquo;</Text>.{'\n'}
              Otherwise use the proper path associated with your endpoint address.
            </Text>
          </View>
        )}
      </View>
    );
  }
;

export default CustomEndpoint;
