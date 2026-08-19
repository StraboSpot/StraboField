import React, {useState} from 'react';
import {Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './about.styles';
import RELEASE_NOTES, {COMMIT_BASE_URL} from '../../../assets/releaseNotes';
import {VERSION_NUMBER} from '../../../shared/app.constants';
import {openUrl} from '../../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../../shared/styles.constants';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';

// Compare two "x.y.z" version strings; returns true if a <= b.
const isVersionAtMost = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
  }
  return true;
};

const About = () => {
  const [isReleaseNotesVisible, setIsReleaseNotesVisible] = useState(false);

  // Only show notes for versions at or below the running build (guards against the bundled file
  // getting ahead of the app during an rc). In dev builds, also show the not-yet-shipped entries
  // (flagged "unreleased") so we can preview the next version's highlights. Grouped by minor series.
  const versionGroups = RELEASE_NOTES
    .filter(entry => __DEV__ || isVersionAtMost(entry.version, VERSION_NUMBER))
    .map(entry => ({...entry, isUnreleased: !isVersionAtMost(entry.version, VERSION_NUMBER)}))
    .reduce((groups, entry) => {
      const series = `${entry.version.split('.').slice(0, 2).join('.')}.x`;
      const group = groups.find(g => g.series === series);
      if (group) group.versions.push(entry);
      else groups.push({series, versions: [entry]});
      return groups;
    }, []);

  const hasReleaseNotes = versionGroups.length > 0;

  // Give each bullet's lead-in (the text before the first colon) a medium weight so it stands out
  // without competing with the version headers. Bullets with no colon render as plain text.
  const renderHighlight = (highlight) => {
    const colonIndex = highlight.indexOf(':');
    if (colonIndex === -1) return highlight;
    return (
      <>
        <Text style={styles.releaseNoteLabel}>{highlight.slice(0, colonIndex + 1)}</Text>
        {highlight.slice(colonIndex + 1)}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.versionRow}>
        <Text style={styles.versionText}>Version: {VERSION_NUMBER}</Text>
        {hasReleaseNotes && (
          <TouchableOpacity
            hitSlop={{bottom: 10, left: 10, right: 10, top: 10}}
            onPress={() => setIsReleaseNotesVisible(true)}
            style={styles.infoIcon}
          >
            <Ionicons color={PRIMARY_ACCENT_COLOR} name={'information-circle-outline'} size={22}/>
          </TouchableOpacity>
        )}
      </View>
      {Platform.OS !== 'web' && <Text style={styles.buildText}>Build: {DeviceInfo.getBuildNumber()}</Text>}
      <ScrollView>
        <Text style={styles.heading}>📌 About StraboField</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>StraboField</Text> is a powerful tool for collecting and organizing geologic field
          data. It allows users to create and manage spatial "Spots" — points, lines, or polygons that store geologic
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
          {'\n'}• Export everything locally to your device's file system
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
      <ModalWrapper
        actionTitle={'Ok'}
        closeModal={() => setIsReleaseNotesVisible(false)}
        headerTitle={'What\'s New'}
        isVisible={isReleaseNotesVisible}
        onActionPressed={() => setIsReleaseNotesVisible(false)}
        overlayStyleOverride={styles.releaseNotesOverlay}
        showCancelButton={false}
        showCloseButton
      >
        <View style={styles.releaseNotesContainer}>
          {versionGroups.map(group => (
            <View key={group.series}>
              <Text style={styles.releaseSeriesHeading}>{group.series} New Features</Text>
              {group.versions.map(entry => (
                <View key={entry.version} style={styles.releaseVersionSection}>
                  <Text style={styles.releaseVersionHeading}>
                    {entry.version}
                    {entry.isUnreleased && <Text style={styles.releaseUnreleasedTag}>{'  · unreleased'}</Text>}
                  </Text>
                  {entry.highlights.length === 0
                    ? <Text style={styles.releaseNoteEmpty}>No user-facing highlights</Text>
                    : entry.highlights.map((highlight, index) => (
                      <View key={index} style={styles.releaseNoteRow}>
                        <Text style={styles.releaseNoteBullet}>{'•'}</Text>
                        <Text style={styles.releaseNoteText}>{renderHighlight(highlight.text)}</Text>
                        {highlight.commit && (
                          <TouchableOpacity
                            hitSlop={{bottom: 8, left: 8, right: 8, top: 8}}
                            onPress={() => openUrl(`${COMMIT_BASE_URL}${highlight.commit}`).catch(() => {
                            })}
                            style={styles.commitLink}
                          >
                            <Ionicons color={PRIMARY_ACCENT_COLOR} name={'logo-github'} size={16}/>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ModalWrapper>
    </View>
  );
};

export default About;
