import React from 'react';
import {FlatList} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {MEDIUMGREY} from '../../shared/styles.constants';
import {NotebookPageAvatar, SpotGeometryAvatar} from '../../shared/ui/avatars';
import usePage from '../page/usePage';
import useProject from '../project/useProject';
import {useTags} from '../tags';

const SpotsListItem = ({doShowTags, isCheckedList, isItemChecked, onChecked, onPress, spot}) => {
  // console.log('Rendering SpotsListItem', spot.properties?.name, spot.properties?.id?.toString(), '...');

  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);

  const {getPopulatedPagesKeys} = usePage();
  const {isReadOnlySpot} = useProject();
  const {addRemoveSpotFromTag, getTagsAtSpot} = useTags();

  /* Derived Variables */

  const isReadOnly = isReadOnlySpot(spot.properties.id);

  /* Event Handlers */

  const handleCheckBoxPressed = () => {
    return onChecked ? onChecked(spot.properties.id) : addRemoveSpotFromTag(spot.properties.id, selectedTag);
  };

  /* Logic Helpers */

  const getSpotDataIcons = () => {
    const populatedPagesKeys = getPopulatedPagesKeys(spot);
    return isReadOnly ? ['isReadOnly', ...populatedPagesKeys] : populatedPagesKeys;
  };

  /* Render Functions */

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

  const renderSpotDataIcon = ({item}) => {
    if (item === 'isReadOnly') {
      return (
        <Icon
          containerStyle={{justifyContent: 'center'}}
          name={'lock-closed'}
          size={12}
          type={'ionicon'}
        />
      );
    }
    else return <NotebookPageAvatar pageKey={item}/>;
  };

  const renderSpotDataIcons = () => (
    <FlatList
      data={getSpotDataIcons()}
      horizontal={false}
      keyExtractor={(item, index) => index.toString()}
      listKey={new Date().toISOString()}
      numColumns={5}
      renderItem={renderSpotDataIcon}
    />
  );

  const renderTags = () => {
    const tags = getTagsAtSpot(spot.properties.id);
    const tagsString = tags.map(tag => tag.name).sort().join(', ');
    return !isEmpty(tagsString) && <ListItem.Subtitle>{tagsString}</ListItem.Subtitle>;
  };

  /* View */

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
          {spot && renderSpotDataIcons()}
          {spot && <ListItem.Chevron/>}
        </>
      )}
    </ListItem>
  );
};

export default React.memo(SpotsListItem);
