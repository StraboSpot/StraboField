import React from 'react';
import {ScrollView, View} from 'react-native';

import DeveloperResourcesSection from './DeveloperResourcesSection';
import documentationStyles from './documentation.styles';
import OnlineResourcesSection from './OnlineResourcesSection';

const Documentation = () => {
  /* View */

  return (
    <View style={documentationStyles.container}>
      <ScrollView style={{flex: 1}}>
        <OnlineResourcesSection/>
        <DeveloperResourcesSection/>
      </ScrollView>
    </View>
  );
};

export default Documentation;
