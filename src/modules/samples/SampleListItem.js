import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import IGSNDisplay from './IGSNDisplay';
import sampleStyles from './samples.styles';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import CheckboxList from '../../shared/ui/CheckboxList';
import useProject from '../project/useProject';
import SpotDataIcons from '../spots/SpotDataIcons';
import useSpots from '../spots/useSpots';
import {useTags} from '../tags';

const SampleListItem = ({isCheckedList, isItemChecked, isShowAvatar, isShowSubtitle, onChecked, onPress, sample}) => {
  const {isSpotInReadOnlyDataset} = useProject();
  const {getSampleSpotIconSource, getSpotWithThisSample} = useSpots();
  const {addRemoveSpotFromTag} = useTags();

  const selectedTag = useSelector(state => state.project.selectedTag);

  const spot = sample.properties?.isSample ? sample : getSpotWithThisSample(sample.id);
  const isReadOnly = isSpotInReadOnlyDataset(spot.properties?.id);

  const sampleMetadata = sample.properties?.isSample ? sample.properties.samples[0] : sample;
  let oriented = sampleMetadata.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';

  const handleCheckBoxPressed = () => {
    return onChecked ? onChecked(spot.properties.id) : addRemoveSpotFromTag(spot.properties.id, selectedTag);
  };

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      key={'SampleListItem' + sampleMetadata.id}
      onPress={() => onPress(sample)}
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
        <View>
          <IGSNDisplay item={sampleMetadata}/>
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
          <SpotDataIcons isReadOnly={isReadOnly} spot={sample.properties?.isSample && sample}/>
          <ListItem.Chevron/>
        </>
      )}
    </ListItem>
  );
};

export default SampleListItem;
