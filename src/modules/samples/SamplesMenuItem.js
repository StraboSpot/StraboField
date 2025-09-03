import React, {useState} from 'react';
import {SectionList, View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import uiStyles from '../../shared/ui/ui.styles';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const SamplesMenuItem = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  const {getActiveSpotsObj, getSpotsWithSamples} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSearched, setSpotsSearched] = useState(activeSpots);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Active Datasets'}/>;
  };

  const renderSample = (sample, spot) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItem}
        key={sample.id}
        onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES, [sample])}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{sample.sample_id_name || 'Unknown'}</ListItem.Title>
        </ListItem.Content>
        <ListItem.Chevron/>
      </ListItem>
    );
  };

  const renderSamplesList = () => {
    let sortedSpotsWithSamples = spotsSorted.filter(spot => !isEmpty(spot.properties.samples));
    if (isReverseSort) sortedSpotsWithSamples = sortedSpotsWithSamples.reverse();
    let count = 0;
    const dataSectioned = sortedSpotsWithSamples.map((s) => {
      count += s.properties.samples.length;
      return {title: s.properties.name, data: s.properties.samples, spot: s};
    });

    return (
      <View style={{flex: 1}}>
        <SpotFilters
          activeSpots={activeSpots}
          setIsReverseSort={setIsReverseSort}
          setSpotsSearched={setSpotsSearched}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          spotsSearched={spotsSearched}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <View style={{flex: 1}}>
          <SectionDivider dividerText={count + (count === 1 ? ' Sample' : ' Samples') + ' in active Spots'}/>
          <SectionList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with samples found'}/>}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, i, section}) => renderSample(item, section.spot)}
            renderSectionHeader={({section}) => renderSectionHeader(section)}
            sections={dataSectioned}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({title, spot}) => {
    return (
      <View style={uiStyles.sectionHeaderBackground}>
        <SectionDividerWithRightButton
          buttonTitle={'View In Spot'}
          dividerText={title}
          onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES)}
        />
      </View>
    );
  };

  return (
    <>
      {isEmpty(getSpotsWithSamples()) ? renderNoSamplesText() : renderSamplesList()}
    </>
  );
};

export default SamplesMenuItem;
