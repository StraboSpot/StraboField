import React from 'react';
import {FlatList, SectionList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {useTags} from '.';
import TagColorIcon from './color/TagColorIcon';
import {TAG_SECTIONS, TAG_TYPES} from './tags.constants';
import {getTagTitle} from './tags.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {PRIMARY_PAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedTag} from '../project/projects.slice';

const TagsList = ({type, selectedIndex}) => {
  console.log('Rendering TagsList...');

  const dispatch = useDispatch();
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  const {getTagFeaturesCount, getTagSpotsCount, toggleContinuousTagging} = useTags();

  const pageKey = type === PAGE_KEYS.GEOLOGIC_UNITS ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const page = PRIMARY_PAGES.find(p => p.key === pageKey);
  const label = page.label;
  const SECTIONS = type === PAGE_KEYS.GEOLOGIC_UNITS ? TAG_SECTIONS.GEOLOGIC_UNITS
    : TAG_SECTIONS.DEFAULT;

  const renderSectionHeader = title => <SectionDivider dividerText={title}/>;

  const renderTag = (tag) => {
    const tagSpotCount = getTagSpotsCount(tag);
    const tagFeatureCount = getTagFeaturesCount(tag);
    const title = type === PAGE_KEYS.GEOLOGIC_UNITS ? tagSpotCount
      : '(' + tagSpotCount + ') (' + tagFeatureCount + ')';
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        onPress={() => {
          dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}));
          dispatch(setSelectedTag(tag));
        }}
      >
        <TagColorIcon color={tag.color}/>
        {useContinuousTagging && (
          <ListItem.CheckBox
            checked={tag.continuousTagging}
            onPress={() => toggleContinuousTagging(tag)}
          />
        )}
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{getTagTitle(tag)}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Content right>
          <ListItem.Title>{title}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderTagsListByMapExtent = () => {
    let tagsInMapExtent;
    if (type === PAGE_KEYS.GEOLOGIC_UNITS) {
      tagsInMapExtent = tags.filter((tag) => {
        return tag.spots && !isEmpty(
          tag.spots.find(spotId => spotsInMapExtentIds?.includes(spotId))) && tag.type === PAGE_KEYS.GEOLOGIC_UNITS;
      });
    }
    else {
      tagsInMapExtent = tags.filter((tag) => {
        return tag.spots && !isEmpty(tag.spots.find(spotId => spotsInMapExtentIds?.includes(spotId)))
          && tag.type !== TAG_TYPES.GEOLOGIC_UNIT;
      });
    }
    console.log('tagsInMapExtent', tagsInMapExtent);

    return (
      <FlatList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={`No Spots with ${label.toLowerCase()} in current map extent`}/>}
        data={tagsInMapExtent}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => renderTag(item)}
      />
    );
  };

  const renderTagsListByRecentlyUsed = () => {
    return <ListEmptyText text={'This has not been implemented yet'}/>;
  };

  const renderTagsListByType = () => {
    const dataSectioned = Object.values(SECTIONS).reduce((acc, {title, key}) => {
      const data = tags?.filter(d => d.type === key) || [];
      const dataSorted = data.slice().sort((a, b) => getTagTitle(a).localeCompare(getTagTitle(b)));
      return [...acc, {title: title, data: dataSorted}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item}) => renderTag(item)}
        renderSectionFooter={({section: {data, title}}) => {
          return data.length === 0 && <ListEmptyText text={'No ' + title}/>;
        }}
        renderSectionHeader={({section: {title}}) => renderSectionHeader(title)}
        sections={dataSectioned}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  const filteredTags = type === PAGE_KEYS.GEOLOGIC_UNITS ? tags.filter(t => t.type === PAGE_KEYS.GEOLOGIC_UNITS)
    : tags.filter(t => t.type !== PAGE_KEYS.GEOLOGIC_UNITS);
  if (isEmpty(filteredTags)) {
    return <ListEmptyText text={`No ${label} Found`}/>;
  }
  else {
    return (
      <View style={{flex: 1}}>
        {selectedIndex === 0 && renderTagsListByType()}
        {selectedIndex === 1 && renderTagsListByMapExtent()}
        {selectedIndex === 2 && renderTagsListByRecentlyUsed()}
      </View>
    );
  }
};

export default TagsList;
