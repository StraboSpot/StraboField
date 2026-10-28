import React from 'react';
import {View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import IGSNLogo from './igsn/IGSNLogo';
import {getSampleMetadata, getSampleTitle} from './samples.helpers';
import sampleStyles from './samples.styles';
import useSamples from './useSamples';
import useStraboSampleWebPage from './useStraboSampleWebPage';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import {BLACK, SAMPLES_COLOR} from '../../shared/styles.constants';
import AvatarWrapper from '../../shared/ui/avatars/AvatarWrapper';
import CheckboxList from '../../shared/ui/CheckboxList';
import UploadModal from '../project/backup/UploadModal';
import useBackupUpload from '../project/backup/useBackupUpload';
import SpotDataIcons from '../spots/SpotDataIcons';
import useSpots from '../spots/useSpots';
import useTags from '../tags/useTags';

const SampleListItem = ({
                          canPickReadOnly,
                          isCheckedList,
                          isItemChecked,
                          isOutlined,
                          isShowAvatar,
                          isShowIGSN,
                          isShowSubtitle,
                          onChecked,
                          onPress,
                          parentSpot,
                          sample,
                        }) => {
  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);

  const {closeUploadModal, isUploadAutoStart, isUploadModalVisible, startUploadFromStatus} = useBackupUpload();
  const {openSamplePage, openUploadedSamplePage} = useSamples();
  const {getSampleSpotIconSource, isSpotReadOnly} = useSpots();
  const {getStraboSampleUrl, openStraboSampleWebPage} = useStraboSampleWebPage();
  const {addRemoveSpotFromTag} = useTags();

  /* Derived Variables */

  const isReadOnly = !canPickReadOnly && isSpotReadOnly(parentSpot);
  // A rich sample is a Spot of its own, which can sit in a different dataset to its parent
  const isSampleReadOnly = isReadOnly || (!!sample.properties?.isSample && isSpotReadOnly(sample));
  const sampleMetadata = getSampleMetadata(sample);
  const oriented = sampleMetadata.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';
  // A linked sample's page on the StraboSamples website, which can only be opened online
  const isLinked = !isEmpty(sampleMetadata.strabosamples_id);
  const sampleUrl = getStraboSampleUrl(sampleMetadata.strabosamples_id);

  /* Event Handlers */

  // The server knows the link by the Spot holding the sample: its own Spot, or the parent it is kept on
  const handleLinkIconPressed = () => openStraboSampleWebPage(sampleMetadata.strabosamples_id,
    sample.properties?.isSample ? sample.properties.id : parentSpot.properties.id);

  const handleIGSNButtonPressed = () => openSamplePage(sampleMetadata.id, startUploadFromStatus,
    sample.properties?.isSample ? sample.properties.id : parentSpot?.properties?.id);

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
        containerStyle={[commonStyles.listItem, isOutlined && {borderColor: SAMPLES_COLOR, borderWidth: 2.5}]}
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
            {/* Viewing an existing IGSN is fine read-only; getting one would change the sample */}
            {(sampleMetadata.Sample_IGSN || (isShowIGSN && !isSampleReadOnly)) && (
              <IGSNLogo hasIGSN={!!sampleMetadata.Sample_IGSN} onIGSNButtonPressed={handleIGSNButtonPressed}/>
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
      {/* Mounted only while showing so a long list doesn't carry an upload modal per row */}
      {isUploadModalVisible && (
        <UploadModal
          afterUploadActionTitle={sampleMetadata.Sample_IGSN ? 'View IGSN' : 'Get IGSN'}
          autoStart={isUploadAutoStart}
          closeModal={closeUploadModal}
          isVisible={isUploadModalVisible}
          onAfterUploadActionPressed={() => openUploadedSamplePage(sampleMetadata.id)}
        />
      )}
    </>
  );
};

export default SampleListItem;
