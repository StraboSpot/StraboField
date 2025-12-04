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

const SpotsListItem = ({doShowTags, isCheckedList, isItemChecked, onChecked, onPress, spot}) => {
  // console.log('Rendering SpotsListItem', spot.properties?.name, spot.properties?.id?.toString(), '...');

  const {isSpotInReadOnlyDataset} = useProject();
  const {addRemoveSpotFromTag, getTagsAtSpot} = useTags();

  const isReadOnly = isSpotInReadOnlyDataset(spot.properties.id);

  const selectedTag = useSelector(state => state.project.selectedTag);

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

  const renderTags = () => {
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
        {doShowTags && spot && renderTags()}
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
