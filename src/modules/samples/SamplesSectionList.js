import React from 'react';
import {SectionList} from 'react-native';

import {useSelector} from 'react-redux';

import SampleListItem from './SampleListItem';
import {isEmpty} from '../../shared/helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/pageKeys.constants';

const SamplesSectionList = ({
                              canPickReadOnly,
                              checkedItems,
                              dataSectioned,
                              isCheckedList,
                              listEmptyText,
                              onChecked,
                              openSpotInNotebook,
                            }) => {
  /* Data Hooks */

  const spots = useSelector(state => state.spot.spots);

  /* Event Handlers */

  const handleSamplePress = (sample, parentSpot) => {
    if (sample.properties?.isSample) openSpotInNotebook(sample, PAGE_KEYS.OVERVIEW, [sample]);
    else openSpotInNotebook(parentSpot, PAGE_KEYS.SAMPLES, [sample]);
  };

  /* Logic Helpers */

  // A caller with its own onChecked is picking the sample itself, so only one that has become a Spot can be
  // checked. A tag instead falls back to the parent Spot, a legacy sample having no Spot of its own to tag
  const getIsItemChecked = (sample, parentSpot) => {
    if (sample.properties?.isSample) return !!checkedItems?.some(i => i === sample.properties.id);
    return !onChecked && !!checkedItems?.some(i => i === parentSpot?.properties?.id);
  };

  /* Render Functions */

  const renderSampleListItem = (sample, parentSpot) => {
    const richSample = spots[sample.id];
    sample = isEmpty(richSample) ? sample : richSample;
    return (
      <SampleListItem
        canPickReadOnly={canPickReadOnly}
        isCheckedList={isCheckedList}
        isItemChecked={getIsItemChecked(sample, parentSpot)}
        isShowAvatar
        onChecked={onChecked}
        onPress={() => handleSamplePress(sample, parentSpot)}
        parentSpot={parentSpot}
        sample={sample}
      />
    );
  };

  const renderSectionHeader = ({title, spot}) => {
    if (title && spot) {
      if (isCheckedList) return <SectionDivider dividerText={title}/>;
      return (
        <SectionDividerWithRightButton
          buttonTitle={'View In Spot'}
          dividerText={title}
          onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES)}
        />
      );
    }
  };

  /* View */

  return (
    <SectionList
      ItemSeparatorComponent={FlatListItemSeparator}
      ListEmptyComponent={<ListEmptyText text={listEmptyText}/>}
      keyExtractor={(item, index) => item + index}
      renderItem={({item, section}) => renderSampleListItem(item, section.spot)}
      renderSectionHeader={({section}) => renderSectionHeader(section)}
      sections={dataSectioned}
      stickySectionHeadersEnabled
    />
  );
};

export default SamplesSectionList;
