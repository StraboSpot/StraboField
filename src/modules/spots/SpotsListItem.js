import React from 'react';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {SAMPLES_COLOR} from '../../shared/styles.constants';
import {SpotGeometryAvatar} from '../../shared/ui/avatars';
import useProject from '../project/useProject';
import {useTags} from '../tags';
import SpotDataIcons from './SpotDataIcons';
import CheckboxList from '../../shared/ui/CheckboxList';

const SpotsListItem = ({
                         doShowSamples,
                         doShowTags,
                         ignoreReadOnly,
                         isCheckedList,
                         isItemChecked,
                         isSample,
                         onChecked,
                         onPress,
                         spot,
                       }) => {
  // console.log('Rendering SpotsListItem', spot.properties?.name, spot.properties?.id?.toString(), '...');

  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);
  const spots = useSelector(state => state.spot.spots);

  const {isReadOnlySpot} = useProject();
  const {addRemoveSpotFromTag, getTagsAtSpot} = useTags();

  /* Derived Variables */

  const isReadOnly = !ignoreReadOnly && isReadOnlySpot(spot.properties.id);

  /* Event Handlers */

  const handleCheckBoxPressed = () => {
    return onChecked ? onChecked(spot.properties.id) : addRemoveSpotFromTag(spot.properties.id, selectedTag);
  };

  /* Render Functions */

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

  /* View */

  return (
    <ListItem
      containerStyle={[commonStyles.listItem, isSample && {borderColor: SAMPLES_COLOR, borderWidth: 2.5}]}
      keyExtractor={(item, index) => item?.properties?.id?.toString() || index.toString()}
      onPress={() => onPress && ((isCheckedList && !isReadOnly) || !isCheckedList) && onPress(spot)}
    >
      <SpotGeometryAvatar spot={spot}/>
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{spot?.properties?.name}</ListItem.Title>
        {doShowTags && spot && renderTagsText()}
        {doShowSamples && spot && renderSamplesText()}
      </ListItem.Content>
      {isCheckedList ? (
        <CheckboxList
          handleCheckBoxPressed={handleCheckBoxPressed}
          isItemChecked={isItemChecked}
          isReadOnly={isReadOnly}
        />
      ) : (
        <>
          {spot && <SpotDataIcons isReadOnly={isReadOnly} spot={spot}/>}
          {spot && <ListItem.Chevron/>}
        </>
      )}
    </ListItem>
  );
};

export default React.memo(SpotsListItem);
