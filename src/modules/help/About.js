import React from 'react';
import {ScrollView, Text, View} from 'react-native';

import styles from './about.styles';
import {VERSION_NUMBER} from '../../shared/app.constants';

const About = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.versionText}>Version: {VERSION_NUMBER}</Text>
      <ScrollView>
        <Text style={styles.heading}>📌 About StraboField</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>StraboField</Text> is a powerful tool for collecting and organizing geologic field
          data. It allows users to create and manage spatial “Spots” — points, lines, or polygons that store geologic
          observations.
          {'\n\n'}
          Spots can be:
          {'\n'}• GPS-referenced using your device
          {'\n'}• Drawn directly on the map
          {'\n'}• Placed on field images you capture
          {'\n\n'}
          You can also organize interpretations using <Text style={styles.bold}>Tags</Text> — flexible labels like
          *geologic units*, *metamorphic grade*, or *fold generations* that apply to multiple spots across varied areas.
        </Text>

        <Text style={styles.heading}>🔗 Integration & Sharing</Text>
        <Text style={styles.paragraph}>
          StraboField works seamlessly with the open-source <Text style={styles.bold}>StraboSpot.org</Text> platform,
          supported by the <Text style={styles.bold}>National Science Foundation</Text>. You can:
          {'\n\n'}• Upload your field data to your online account
          {'\n'}• Export everything locally to your device’s file system
        </Text>

        <Text style={styles.heading}>🗺️ Custom & Offline Maps</Text>
        <Text style={styles.paragraph}>
          Enhance your fieldwork with custom basemaps from:
          {'\n'}• StraboSpot My Maps
          {'\n'}• MapWarper
          {'\n'}• Mapbox Studio
          {'\n\n'}
          All maps — including built-in and custom — can be downloaded for full offline use in the field.
        </Text>
      </ScrollView>
    </View>
  );
};

export default About;
