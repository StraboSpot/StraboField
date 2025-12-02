import React, {useState} from 'react';
import {SectionList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {AvatarWrapper} from '../../shared/ui/avatars';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/page.constants';
import {SpotsListItem, useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  const {getActiveSpotsObj, getSpotsWithSamples} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Visible Datasets'}/>;
  };

  const getEmbeddedSampleAvatarSource = (spot) => {
    if (spot.geometry?.type === 'Point') return require('../../assets/icons/Sample_in_point_pressed_round.png');
    else if (spot.geometry?.type === 'LineString') {
      return require('../../assets/icons/Sample_in_line_pressed_round.png');
    }
    else if (spot.geometry?.type === 'Polygon') {
      return require('../../assets/icons/Sample_in_polygon_pressed_round.png');
    }
    else return require('../../assets/icons/SampleSpot_pressed_round.png');
  };

  const renderSample = (sample, spot) => {
    if (spot) {
      return (
        <ListItem
          containerStyle={commonStyles.listItem}
          key={sample.id}
          onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES, [sample])}
        >
          <AvatarWrapper
            size={20}
            source={getEmbeddedSampleAvatarSource(spot)}
          />
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>{sample.sample_id_name || 'Unknown'}</ListItem.Title>
          </ListItem.Content>
          <ListItem.Chevron/>
        </ListItem>
      );
    }
    else {
      return (
        <SpotsListItem
          doShowTags={true}
          onPress={openSpotInNotebook}
          spot={sample}
        />
      );
    }
  };

  const renderSamplesList = () => {
    let sortedSpotsWithSamples = spotsSorted.filter(spot => !isEmpty(spot.properties.samples));
    const activeSampleSpots = spotsSorted.filter(spot => !isEmpty(spot.properties.isSample));
    sortedSpotsWithSamples = sortedSpotsWithSamples.filter((spot) => {
      const activeSampleSpotsIds = activeSampleSpots.map(ss => ss.properties.id);
      return !activeSampleSpotsIds.includes(spot.properties.id);
    });
    if (isReverseSort) sortedSpotsWithSamples = sortedSpotsWithSamples.reverse();
    let count = 0;
    let dataSectioned = sortedSpotsWithSamples.map((s) => {
      count += s.properties.samples.length;
      return {title: s.properties.name, data: s.properties.samples, spot: s};
    });
    let sampleSpotsCount = 0;
    if (!isEmpty(activeSampleSpots)) {
      dataSectioned = [{data: isReverseSort ? activeSampleSpots.reverse() : activeSampleSpots}, ...dataSectioned];
      sampleSpotsCount = activeSampleSpots.length;
    }
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
            Found {totalSamplesCount + (totalSamplesCount === 1 ? ' sample: ' : ' samples: ')}
            {sampleSpotsCount} independent{(sampleSpotsCount === 1 ? ' sample ' : ' samples ')}
            and {count + (count === 1 ? ' sample' : ' samples')} embedded within Spots
          </Text>
          <SectionList
            ItemSeparatorComponent={FlatListItemSeparator}
            ListEmptyComponent={<ListEmptyText text={textNoSpots + ' with samples found'}/>}
            keyExtractor={(item, index) => item + index}
            renderItem={({item, section}) => renderSample(item, section.spot)}
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
    else return <SectionDivider dividerText={'Independent Samples'}/>;
  };

  return (
    <>
      {isEmpty(getSpotsWithSamples()) ? renderNoSamplesText() : renderSamplesList()}
    </>
  );
};

export default Samples;
