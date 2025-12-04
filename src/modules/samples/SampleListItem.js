import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import IGSNDisplay from './IGSNDisplay';
import sampleStyles from './samples.styles';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import useProject from '../project/useProject';
import SpotDataIcons from '../spots/SpotDataIcons';
import useSpots from '../spots/useSpots';

const SampleListItem = ({onPress, sample, isShowAvatar, isShowSubtitle}) => {
  const {isSpotInReadOnlyDataset} = useProject();
  const {getSpotWithThisSample} = useSpots();

  const spot = sample.properties?.isSample ? sample : getSpotWithThisSample(sample.id);
  const isReadOnly = isSpotInReadOnlyDataset(spot.properties?.id);

  const sampleMetadata = sample.properties?.isSample ? sample.properties.samples[0] : sample;
  let oriented = sampleMetadata.oriented_sample === 'yes' ? 'Oriented' : 'Unoriented';

  const getEmbeddedSampleAvatarSource = () => {
    if (spot.geometry?.type === 'Point') return require('../../assets/icons/Sample_in_point_pressed_round.png');
    else if (spot.geometry?.type === 'LineString') {
      return require('../../assets/icons/Sample_in_line_pressed_round.png');
    }
    else if (spot.geometry?.type === 'Polygon') {
      return require('../../assets/icons/Sample_in_polygon_pressed_round.png');
    }
    else return require('../../assets/icons/SampleSpot_pressed_round.png');
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
          source={getEmbeddedSampleAvatarSource(spot)}
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
      <SpotDataIcons isReadOnly={isReadOnly} spot={sample.properties?.isSample && sample}/>
      <ListItem.Chevron/>
    </ListItem>
  );
};

export default SampleListItem;
