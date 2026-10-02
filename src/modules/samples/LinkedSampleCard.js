import React, {useEffect, useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SAMPLE_DETAIL_TABS} from './samples.constants';
import {getSampleMetadata} from './samples.helpers';
import sampleStyles from './samples.styles';
import useStraboSampleWebPage from './useStraboSampleWebPage';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {DARKGREY, PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {setNotebookPageVisible, setRequestedSampleDetailTab} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';

// The card in a Sample Spot's overview saying it is linked to StraboSamples, with a pill for each app whose data came
// with the link that opens Sample Detail on that app's tab. Online, it shows whether the link has been uploaded, checked
// again after each upload, and opens the sample on the StraboSamples website once it has.
const LinkedSampleCard = ({spot}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spotsUploadedTimestamp = useSelector(state => state.connections.spotsUploadedTimestamp);
  const {getIsLinkUploaded, getStraboSampleUrl, openStraboSampleWebPage} = useStraboSampleWebPage();

  /* Derived Variables */

  const sample = getSampleMetadata(spot);
  const strabosamplesId = sample.strabosamples_id;
  const sampleUrl = getStraboSampleUrl(strabosamplesId, spot.properties.id);
  const linkedTabs = SAMPLE_DETAIL_TABS.filter(tab => tab.dataKey && !isEmpty(spot.properties[tab.dataKey]));

  /* Local State */

  // Whether the server has the link yet, unknown until asked and while offline
  const [isLinkUploaded, setIsLinkUploaded] = useState(undefined);

  /* Side Effects */

  useEffect(() => {
    let isCurrent = true;
    setIsLinkUploaded(undefined);
    if (sampleUrl) {
      getIsLinkUploaded(strabosamplesId, spot.properties.id)
        .then(isUploaded => isCurrent && setIsLinkUploaded(isUploaded))
        .catch(err => console.error('Error checking the sample on StraboSamples', err));
    }
    return () => {
      isCurrent = false;
    };
  }, [sampleUrl, spot.properties.id, spotsUploadedTimestamp]);

  /* Event Handlers */

  const onTabPillPressed = (tabKey) => {
    dispatch(setSelectedAttributes([sample]));
    dispatch(setRequestedSampleDetailTab(tabKey));
    dispatch(setNotebookPageVisible(PAGE_KEYS.SAMPLES));
  };

  /* Render Functions */

  const renderStatus = () => {
    if (isLinkUploaded === false) {
      return (
        <View style={sampleStyles.linkedCardStatusContainer}>
          <Icon color={DARKGREY} name={'cloud-upload-outline'} size={18} type={'ionicon'}/>
          <Text style={sampleStyles.linkedCardStatus}>Not uploaded yet</Text>
        </View>
      );
    }
    if (isLinkUploaded) {
      return (
        <View style={sampleStyles.linkedCardStatusContainer}>
          <Icon color={PRIMARY_ACCENT_COLOR} name={'cloud-done-outline'} size={18} type={'ionicon'}/>
          <Text style={[sampleStyles.linkedCardStatus, sampleStyles.linkedCardStatusUploaded]}>Open URL</Text>
        </View>
      );
    }
    return null;
  };

  /* View */

  if (isEmpty(strabosamplesId)) return null;

  return (
    <Pressable
      accessibilityHint={sampleUrl ? 'Opens the sample on the StraboSamples website' : undefined}
      accessibilityRole={sampleUrl ? 'button' : undefined}
      disabled={!sampleUrl}
      onPress={() => openStraboSampleWebPage(strabosamplesId, spot.properties.id)}
      style={({pressed}) => [sampleStyles.linkedCard, pressed && sampleStyles.actionButtonPressed]}
    >
      <Icon
        color={PRIMARY_ACCENT_COLOR}
        iconStyle={{transform: [{rotate: '-45deg'}]}}
        name={'link'}
        size={18}
        type={'ionicon'}
      />
      <View style={sampleStyles.linkedCardContent}>
        <Text style={sampleStyles.linkedCardTitle}>Linked to StraboSamples</Text>
        {!isEmpty(linkedTabs) && (
          <View style={sampleStyles.linkedCardPills}>
            {linkedTabs.map(tab => (
              <Pressable
                accessibilityHint={`Opens the sample's ${toTitleCase(tab.key)} data`}
                accessibilityRole={'button'}
                hitSlop={4}
                key={tab.key}
                onPress={() => onTabPillPressed(tab.key)}
                style={({pressed}) => [sampleStyles.linkedCardPill, pressed && sampleStyles.linkedCardPillPressed]}
              >
                <Text style={sampleStyles.linkedCardPillText}>{toTitleCase(tab.key)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {renderStatus()}
    </Pressable>
  );
};

export default LinkedSampleCard;
