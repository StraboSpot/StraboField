import React, {useState} from 'react';
import {View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import IGSNLogo from './igsn/IGSNLogo';
import IGSNModal from './igsn/IGSNModal';
import {getSampleMetadata, getSampleTitle} from './samples.helpers';
import sampleStyles from './samples.styles';
import useStraboSampleWebPage from './useStraboSampleWebPage';
import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import {BLACK, SAMPLES_COLOR} from '../../shared/styles.constants';
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

  const dispatch = useDispatch();
  const isOwner = useSelector(state => state.project.project?.isOwner);
  const selectedTag = useSelector(state => state.project.selectedTag);

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

  /* Local State */

  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

  /* Event Handlers */

  // The server knows the link by the Spot holding the sample: its own Spot, or the parent it is kept on
  const handleLinkIconPressed = () => openStraboSampleWebPage(sampleMetadata.strabosamples_id,
    sample.properties?.isSample ? sample.properties.id : parentSpot.properties.id);

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
            {/* Anyone may view an existing IGSN, but getting one registers and changes the sample, which only the
             project owner may do and only when the sample is not read only */}
            {(sampleMetadata.Sample_IGSN || (isShowIGSN && !isSampleReadOnly && isOwner !== false)) && (
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
