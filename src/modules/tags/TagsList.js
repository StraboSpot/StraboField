import React from 'react';
import {SectionList, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import TagColorIcon from './color/TagColorIcon';
import {TAG_FILTER_LABELS, TAG_FILTERS} from './query/tagQuery.constants';
import {TAG_COUNT_ICON_SIZE, TAG_SECTIONS} from './tags.constants';
import {getTagTitle} from './tags.helpers';
import tagsStyles from './tags.styles';
import useTags from './useTags';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {DARKGREY} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {PRIMARY_PAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedTag} from '../project/projects.slice';

const TagsList = ({activeFilters = [], tagsSorted, type}) => {
  console.log('Rendering TagsList...');

  const dispatch = useDispatch();
  const spotsInMapExtentIds = useSelector(state => state.map.spotsInMapExtentIds);
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  const {
    getReportsWithThisTag,
    getSamplesWithThisTag,
    getSpotsWithThisTagCount,
    getTagFeaturesCount,
    toggleContinuousTagging,
  } = useTags();

  const pageKey = type === PAGE_KEYS.GEOLOGIC_UNITS ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const page = PRIMARY_PAGES.find(p => p.key === pageKey);
  const label = page.label;
  const SECTIONS = type === PAGE_KEYS.GEOLOGIC_UNITS ? TAG_SECTIONS.GEOLOGIC_UNITS
    : TAG_SECTIONS.DEFAULT;
  const hasActiveFilters = !isEmpty(activeFilters);
  const inMapExtent = activeFilters.includes(TAG_FILTERS.MAP_EXTENT);

  let scopeText = '';
  if (activeFilters.length > 1) scopeText = `in ${activeFilters.length} filters`;
  else if (activeFilters.length === 1) {
    const filterLabel = TAG_FILTER_LABELS[activeFilters[0]];
    scopeText = /^(In|On) /.test(filterLabel) ? filterLabel.charAt(0).toLowerCase() + filterLabel.slice(1)
      : `in ${filterLabel}`;
  }
  const scopeSuffix = scopeText ? ` ${scopeText}` : '';

  // Always grouped by type; active filters (e.g. Map Extent) narrow the tags as an intersection.
  const dataSectioned = Object.values(SECTIONS).reduce((acc, {title, key}) => {
    let data = (tagsSorted || []).filter(d => d.type === key);
    if (inMapExtent) {
      data = data.filter(
        tag => tag.spots && !isEmpty(tag.spots.find(spotId => spotsInMapExtentIds?.includes(spotId))),
      );
    }
    // With filters active, hide empty type sections; unfiltered, keep them (they show a "No <type>" footer).
    return hasActiveFilters && isEmpty(data) ? acc : [...acc, {title: title, data: data}];
  }, []);

  const renderSectionHeader = title => <SectionDivider dividerText={title}/>;

  // What a tag holds, each count beside an icon for what is being counted, so a row says what it means without a
  // legend above the list. A count of none is left out rather than shown as a zero, which keeps the row short.
  // Not every kind of record can carry a geologic unit, so those are counted only for an ordinary tag
  const renderTagCounts = (tag) => {
    const counts = [
      {key: 'spots', count: getSpotsWithThisTagCount(tag), icon: 'map-marker'},
      {key: 'samples', count: getSamplesWithThisTag(tag).length, icon: 'pickaxe'},
      ...(type === PAGE_KEYS.GEOLOGIC_UNITS ? [] : [
        {key: 'features', count: getTagFeaturesCount(tag), icon: 'circle-double'},
        {key: 'memos', count: getReportsWithThisTag(tag).length, icon: 'note'},
      ]),
    ].filter(c => c.count > 0);
    if (isEmpty(counts)) return null;
    return (
      <View style={tagsStyles.tagCountsContainer}>
        {counts.map(c => (
          <View key={c.key} style={tagsStyles.tagCount}>
            <Icon color={DARKGREY} name={c.icon} size={TAG_COUNT_ICON_SIZE} type={'material-community'}/>
            <Text style={tagsStyles.tagCountText}>{c.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTag = (tag) => {
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
          {renderTagCounts(tag)}
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderTagsList = () => {
    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        ListEmptyComponent={<ListEmptyText text={`No ${label}${scopeSuffix}`}/>}
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
  if (isEmpty(filteredTags)) return <ListEmptyText text={`No ${label} Found`}/>;
  else {
    return (
      <>
        {hasActiveFilters && !isEmpty(dataSectioned) && (
          <View style={{alignItems: 'flex-start', paddingHorizontal: 10, paddingTop: 10}}>
            <Text style={commonStyles.standardDescriptionText}>Filtered Results:</Text>
          </View>
        )}
        <View style={{flex: 1}}>
          {renderTagsList()}
        </View>
      </>
    );
  }
};

export default TagsList;
