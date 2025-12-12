import React from 'react';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {MEDIUMGREY} from '../../shared/styles.constants';
import {SpotGeometryAvatar} from '../../shared/ui/avatars';
import useProject from '../project/useProject';
import {useTags} from '../tags';
import SpotDataIcons from './SpotDataIcons';

const SpotsListItem = ({doShowSamples, doShowTags, isCheckedList, isItemChecked, onChecked, onPress, spot}) => {
  // console.log('Rendering SpotsListItem', spot.properties?.name, spot.properties?.id?.toString(), '...');

  const {isSpotInReadOnlyDataset} = useProject();
  const {addRemoveSpotFromTag, getTagsAtSpot} = useTags();

  const isReadOnly = isSpotInReadOnlyDataset(spot.properties.id);

  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const handleCheckBoxPressed = () => {
    return onChecked ? onChecked(spot.properties.id) : addRemoveSpotFromTag(spot.properties.id, selectedTag);
  };

  const renderCheckboxes = () => {
    return (
      <>
        {isReadOnly && (
          <Icon
            color={MEDIUMGREY}
            containerStyle={{justifyContent: 'center', paddingRight: 5}}
            name={'lock-closed'}
            size={20}
            type={'ionicon'}
          />
        )}
        <ListItem.CheckBox
          checked={isItemChecked}
          disabled={isReadOnly}
          onPress={handleCheckBoxPressed}
        />
      </>
    );
  };

  const renderSamplesText = () => {
    const sampleNames = spot.properties?.samples?.reduce(
      (acc, s) => spots[s.id] ? [...acc, spots[s.id].properties.name] : [...acc, s.sample_id_name], []);
    const samplesString = sampleNames?.sort()?.join(', ');
    return !isEmpty(samplesString) && <ListItem.Subtitle>{samplesString}</ListItem.Subtitle>;
  };

  const renderTagsText = () => {
    const tags = getTagsAtSpot(spot.properties.id);
    const tagsString = tags.map(tag => tag.name).sort().join(', ');
    return !isEmpty(tagsString) && <ListItem.Subtitle>{tagsString}</ListItem.Subtitle>;
  };

  return (
    <ListItem
      containerStyle={commonStyles.listItem}
      keyExtractor={(item, index) => item?.properties?.id?.toString() || index.toString()}
      onPress={() => onPress && ((isCheckedList && !isReadOnly) || !isCheckedList) && onPress(spot)}
    >
      <SpotGeometryAvatar spot={spot}/>
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{spot?.properties?.name}</ListItem.Title>
        {doShowTags && spot && renderTagsText()}
        {doShowSamples && spot && renderSamplesText()}
      </ListItem.Content>
      {isCheckedList ? renderCheckboxes() : (
        <>
          {spot && <SpotDataIcons isReadOnly={isReadOnly} spot={spot}/>}
          {spot && <ListItem.Chevron/>}
        </>
      )}
    </ListItem>
  );
};

export default SpotsListItem;
