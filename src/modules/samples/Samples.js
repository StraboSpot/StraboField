import React, {useState} from 'react';
import {SectionList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import SampleListItem from './SampleListItem';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  const spots = useSelector(state => state.spot.spots);

  const {getActiveSpotsObj, getSpotsWithSamples} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Visible Datasets'}/>;
  };

  const handleSamplePress = (sample, parentSpot) => {
    if (sample.properties?.isSample) openSpotInNotebook(sample, PAGE_KEYS.OVERVIEW, [sample]);
    else openSpotInNotebook(parentSpot, PAGE_KEYS.SAMPLES, [sample]);
  };

  const renderSampleListItem = (sample, parentSpot) => {
    const richSample = spots[sample.id];
    sample = isEmpty(richSample) ? sample : richSample;
    return <SampleListItem isShowAvatar onPress={() => handleSamplePress(sample, parentSpot)} sample={sample}/>;
  };

  const renderSamplesList = () => {
    let sortedSpotsWithSamples = spotsSorted.filter(
      spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);
    if (isReverseSort) sortedSpotsWithSamples = sortedSpotsWithSamples.reverse();
    let count = 0;
    let dataSectioned = sortedSpotsWithSamples.map((s) => {
      count += s.properties.samples.length;
      return {title: s.properties.name, data: s.properties.samples, spot: s};
    });
    let sampleSpotsCount = 0;
    const totalSamplesCount = count + sampleSpotsCount;

    return (
      <View style={{flex: 1}}>
        <SpotFilters
          activeSpots={activeSpots}
          doSearchSubSamples={true}
          setIsReverseSort={setIsReverseSort}
          setSpotsSorted={setSpotsSorted}
          setTextNoSpots={setTextNoSpots}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <View style={{flex: 1}}>
          <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
            Found {totalSamplesCount + (totalSamplesCount === 1 ? ' sample' : ' samples')}
          </Text>
          <SectionList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with samples found'}/>}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, section}) => renderSampleListItem(item, section.spot)}
            renderSectionHeader={({section}) => renderSectionHeader(section)}
            sections={dataSectioned}
            stickySectionHeadersEnabled={true}
          />
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({title, spot}) => {
    if (title && spot) {
      return (
        <SectionDividerWithRightButton
          buttonTitle={'View In Spot'}
          dividerText={title}
          onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES)}
        />
      );
    }
  };

  return (
    <>
      {isEmpty(getSpotsWithSamples()) ? renderNoSamplesText() : renderSamplesList()}
    </>
  );
};

export default Samples;
