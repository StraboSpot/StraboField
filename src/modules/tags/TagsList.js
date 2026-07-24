import React from 'react';
import {SectionList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {useTags} from '.';
import TagColorIcon from './color/TagColorIcon';
import {TAG_FILTER_LABELS, TAG_FILTERS} from './query/tagQuery.constants';
import {TAG_SECTIONS} from './tags.constants';
import {getTagTitle} from './tags.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
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

  const {getTagFeaturesCount, getSamplesWithThisTag, getSpotsWithThisTagCount, toggleContinuousTagging} = useTags();

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

  const renderTag = (tag) => {
    const tagSpotCount = getSpotsWithThisTagCount(tag);
    const tagFeatureCount = getTagFeaturesCount(tag);
    let taggedSamplesCount = getSamplesWithThisTag(tag).length;
    const title = type === PAGE_KEYS.GEOLOGIC_UNITS ? tagSpotCount + ' | ' + taggedSamplesCount
      : tagSpotCount + ' | ' + taggedSamplesCount + ' | ' + tagFeatureCount;
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
  if (isEmpty(filteredTags)) {
    return <ListEmptyText text={`No ${label} Found`}/>;
  }
  else {
    return (
      <>
        {!isEmpty(dataSectioned) && (
          <View style={{alignItems: 'flex-end', paddingHorizontal: 10, paddingTop: 10}}>
            {hasActiveFilters && <Text style={commonStyles.standardDescriptionText}>Filtered Results:</Text>}
            <Text style={commonStyles.standardDescriptionText}>
              {pageKey === PAGE_KEYS.GEOLOGIC_UNITS ? '# Tagged Spots | Samples' : '# Tagged Spots | Samples | Features'}
            </Text>
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
