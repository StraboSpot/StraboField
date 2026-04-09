import React from 'react';
import {ScrollView, View} from 'react-native';

import {useSelector} from 'react-redux';

import DeveloperResourcesSection from './DeveloperResourcesSection';
import OfflineResourcesSection from './OfflineResourcesSection';
import OnlineResourcesSection from './OnlineResourcesSection';

const Documentation = ({navigation}) => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  /* Event Handlers */

  const handlePress = document => navigation.navigate('DocumentationScreen', {document});

  /* View */

  return (
    <View style={{flex: 1}}>
      <ScrollView style={{flex: 1}}>
        <OfflineResourcesSection onPress={handlePress}/>
        {isOnline && <OnlineResourcesSection/>}
        <DeveloperResourcesSection/>
      </ScrollView>
    </View>
  );
};

export default Documentation;
