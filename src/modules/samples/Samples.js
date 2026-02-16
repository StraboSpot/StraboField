import React, {useState} from 'react';
import {SectionList, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {PAGE_KEYS} from '../page/page.constants';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  /* Data Hooks / State */

  const {getActiveSpotsObj, getSpotsWithSamples} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSearched, setSpotsSearched] = useState(activeSpots);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  /* Render Functions */

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Visible Datasets'}/>;
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
          <LittleSpacer/>
          <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center'}]}>
            Found {count + (count === 1 ? ' sample' : ' samples')} in visible Spots
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
    return (
      <SectionDividerWithRightButton
        buttonTitle={'View In Spot'}
        dividerText={title}
        onPress={() => openSpotInNotebook(spot, PAGE_KEYS.SAMPLES)}
      />
    );
  };

  /* View */

  return (
    <>
      {isEmpty(getSpotsWithSamples()) ? renderNoSamplesText() : renderSamplesList()}
    </>
  );
};

export default Samples;
