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

const SamplesSectionList = ({checkedItems, dataSectioned, isCheckedList, listEmptyText, openSpotInNotebook}) => {
  /* Data Hooks */

  const spots = useSelector(state => state.spot.spots);

  /* Event Handlers */

  const handleSamplePress = (sample, parentSpot) => {
    if (sample.properties?.isSample) openSpotInNotebook(sample, PAGE_KEYS.OVERVIEW, [sample]);
    else openSpotInNotebook(parentSpot, PAGE_KEYS.SAMPLES, [sample]);
  };

  /* Render Functions */

  const renderSampleListItem = (sample, parentSpot) => {
    const richSample = spots[sample.id];
    sample = isEmpty(richSample) ? sample : richSample;
    return (
      <SampleListItem
        isCheckedList={isCheckedList}
        isItemChecked={checkedItems?.find(
          i => sample.properties?.isSample ? i === sample.properties.id : i === parentSpot?.properties?.id)}
        isShowAvatar
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
