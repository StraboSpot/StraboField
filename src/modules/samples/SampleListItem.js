import React, {useState} from 'react';
import {View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import IGSNLogo from './igsn/IGSNLogo';
import IGSNModal from './igsn/IGSNModal';
import {
  getSampleMetadata,
  getSampleTitle,
  getStraboSampleFromResponse,
  isLinkedToFieldSpot,
} from './samples.helpers';
import sampleStyles from './samples.styles';
import {SAMPLES_PATHS} from '../../services/network/urls.constants';
import useServerRequests from '../../services/network/useServerRequests';
import commonStyles from '../../shared/common.styles';
import {isEmpty, openUrl, truncateText} from '../../shared/helpers';
import {BLACK} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import AvatarWrapper from '../../shared/ui/avatars/AvatarWrapper';
import CheckboxList from '../../shared/ui/CheckboxList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import SpotDataIcons from '../spots/SpotDataIcons';
import useSpots from '../spots/useSpots';
import useTags from '../tags/useTags';

const SampleListItem = ({
                          canPickReadOnly,
                          isCheckedList,
                          isItemChecked,
                          isShowAvatar,
                          isShowIGSN,
                          isShowSubtitle,
                          onChecked,
                          onPress,
                          parentSpot,
                          sample,
                        }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isInternetReachable = useSelector(state => state.connections.isOnline.isInternetReachable);
  const selectedTag = useSelector(state => state.project.selectedTag);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {getStraboSample} = useServerRequests();
  const {getSampleSpotIconSource, isSpotReadOnly} = useSpots();
  const {addRemoveSpotFromTag} = useTags();

  /* Derived Variables */

  const isReadOnly = !canPickReadOnly && isSpotReadOnly(parentSpot);
  const sampleMetadata = getSampleMetadata(sample);
  const oriented = sampleMetadata.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';
  // A linked sample's page on the StraboSamples website, which can only be opened online
  const isLinked = !isEmpty(sampleMetadata.strabosamples_id);
  const sampleUrl = isLinked && isInternetReachable && !isEmpty(straboUserId)
    ? `${SAMPLES_PATHS.WEB_SAMPLE}${encodeURIComponent(straboUserId)}/${encodeURIComponent(
      sampleMetadata.strabosamples_id)}`
    : undefined;

  /* Local State */

  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

  /* Event Handlers */

  // The website only knows the sample is linked once the Spot carrying the link has been uploaded, so ask the server
  // before opening it rather than land on a page that doesn't show the link yet
  const handleLinkIconPressed = async () => {
    try {
      const response = await getStraboSample(sampleMetadata.strabosamples_id);
      const strabosample = getStraboSampleFromResponse(response) ?? {};
      // The server knows the link by the Spot holding the sample: its own Spot, or the parent it is kept on
      const spotId = sample.properties?.isSample ? sample.properties.id : parentSpot.properties.id;
      if (!isLinkedToFieldSpot(strabosample, spotId)) {
        alert('Link Not Uploaded', 'This sample\'s link to StraboSamples hasn\'t been uploaded yet. Upload the'
          + ' project, then try again.');
        return;
      }
    }
    catch (err) {
      console.error('Error checking the sample on StraboSamples', err);
      alert('Uh Oh!', 'Could not check this sample on StraboSamples. Please try again.');
      return;
    }
    try {
      await openUrl(sampleUrl);
    }
    catch (err) {
      console.error('Can\'t open URL', err);
      alert('Uh Oh!', `Can not open the url ${sampleUrl}`);
    }
  };

  const handleIGSNButtonPressed = () => {
    if (sampleMetadata.Sample_IGSN) dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));
    else setIsIGSNModalVisible(true);
  };

  // A caller with its own onChecked takes the press instead of the tag write, and gets the parent Spot too
  // since a legacy sample carries no id of its own that means anything outside it
  const handleCheckBoxPressed = () => {
    if (onChecked) return onChecked(sample, parentSpot);
    return addRemoveSpotFromTag(sample.properties?.isSample ? sample.properties.id : parentSpot.properties.id,
      selectedTag);
  };

  /* View */

  return (
    <>
      <ListItem
        containerStyle={commonStyles.listItem}
        key={'SampleListItem' + sampleMetadata.id}
        onPress={() => isCheckedList ? handleCheckBoxPressed() : onPress(sample)}
      >
        {isShowAvatar && (
          <AvatarWrapper
            size={20}
            source={getSampleSpotIconSource()}
          />
        )}
        <ListItem.Content style={sampleStyles.listContentContainer}>
          <View style={{flexShrink: 1}}>
            <ListItem.Title style={{...commonStyles.listItemTitle, textAlign: 'left'}}>
              {getSampleTitle(sample)}
            </ListItem.Title>
            {isShowSubtitle && (
              <ListItem.Subtitle>
                {oriented} - {sampleMetadata.sample_description ? truncateText(sampleMetadata.sample_description,
                25) : 'No Description'}
              </ListItem.Subtitle>
            )}
          </View>
          <View style={{alignItems: 'center', flexDirection: 'row', gap: 10}}>
            {/* Linked to a StraboSamples sample, so it is shared with StraboMicro and StraboExperimental. Offline it
             only says so; online it also opens the sample on the website. */}
            {isLinked && (
              <Icon
                accessibilityLabel={sampleUrl ? 'Open sample in StraboSamples' : 'Linked to StraboSamples'}
                color={BLACK}
                iconStyle={{transform: [{rotate: '-45deg'}]}}
                name={'link'}
                onPress={sampleUrl ? handleLinkIconPressed : undefined}
                size={22}
                type={'ionicon'}
              />
            )}
            {(isShowIGSN || sampleMetadata.Sample_IGSN) && (
              <IGSNLogo
                item={sampleMetadata}
                onIGSNButtonPressed={handleIGSNButtonPressed}
              />
            )}
          </View>
        </ListItem.Content>
        {isCheckedList ? (
          <CheckboxList
            handleCheckBoxPressed={handleCheckBoxPressed}
            isItemChecked={isItemChecked}
            isReadOnly={isReadOnly}
          />
        ) : (
          <>
            <SpotDataIcons isReadOnly={isReadOnly} spot={sample.properties?.isSample ? sample : undefined}/>
            <ListItem.Chevron/>
          </>
        )}
      </ListItem>
      <IGSNModal
        isVisible={isIGSNModalVisible}
        onIGSNUpdated={() => dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN))}
        onModalCancel={() => setIsIGSNModalVisible(false)}
        sampleValues={sampleMetadata}
      />
    </>
  );
};

export default SampleListItem;
