import React, {useState} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import IGSNLogo from './igsn/IGSNLogo';
import IGSNModal from './igsn/IGSNModal';
import sampleStyles from './samples.styles';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import CheckboxList from '../../shared/ui/CheckboxList';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import useProject from '../project/useProject';
import SpotDataIcons from '../spots/SpotDataIcons';
import useSpots from '../spots/useSpots';
import {useTags} from '../tags';

const SampleListItem = ({
                          isCheckedList,
                          isItemChecked,
                          isShowAvatar,
                          isShowIGSN,
                          isShowSubtitle,
                          onPress,
                          parentSpot,
                          sample,
                        }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {isReadOnlySpot} = useProject();
  const {getSampleSpotIconSource} = useSpots();
  const {addRemoveSpotFromTag} = useTags();

  /* Derived Variables */

  const isReadOnly = isReadOnlySpot(parentSpot.properties?.id);
  const sampleMetadata = sample.properties?.isSample ? (sample.properties.samples?.[0] ?? {id: sample.properties.id}) : sample;
  const oriented = sampleMetadata.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';

  /* Local State */

  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

  /* Event Handlers */

  const handleIGSNButtonPressed = () => {
    if (sampleMetadata.Sample_IGSN) dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));
    else setIsIGSNModalVisible(true);
  };

  const handleCheckBoxPressed = () => {
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
          <View>
            <ListItem.Title titleStyle={{...commonStyles.listItemTitle, textAlign: 'left'}}>
              {sampleMetadata.sample_id_name || 'Unknown'}
            </ListItem.Title>
            {isShowSubtitle && (
              <ListItem.Subtitle>
                {oriented} - {sampleMetadata.sample_description ? truncateText(sampleMetadata.sample_description,
                25) : 'No Description'}
              </ListItem.Subtitle>
            )}
          </View>
          {(isShowIGSN || sampleMetadata.Sample_IGSN) && (
            <View>
              <IGSNLogo
                item={sampleMetadata}
                onIGSNButtonPressed={handleIGSNButtonPressed}
              />
            </View>
          )}
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
        isSampleSpotId={sample.properties?.isSample ? sample.properties.id : undefined}
        isVisible={isIGSNModalVisible}
        onIGSNUpdated={() => dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN))}
        onModalCancel={() => setIsIGSNModalVisible(false)}
        sampleValues={sampleMetadata}
      />
    </>
  );
};

export default SampleListItem;
