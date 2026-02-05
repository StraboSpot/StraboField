import React, {useState} from 'react';
import {Text, View} from 'react-native';

import SamplesSectionList from './SamplesSectionList';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({checkedItems, handleSpotChecked, isCheckedList, openSpotInNotebook, updateSpotsInMapExtent}) => {
  const {getActiveSpotsObj, getSpotsWithSamples} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsSorted, setSpotsSorted] = useState(activeSpots);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Visible Datasets');

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Active Datasets'}/>;
  };

  const renderSamples = () => {
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
            Found {totalSamplesCount + (totalSamplesCount === 1 ? ' Sample' : ' Samples')}
            {isCheckedList ? ' in Project' : ' in Active Datasets'}
          </Text>
          <SamplesSectionList
            checkedItems={checkedItems}
            dataSectioned={dataSectioned}
            handleSpotChecked={handleSpotChecked}
            isCheckedList={isCheckedList}
            listEmptyText={textNoSpots + ' with samples found'}
            openSpotInNotebook={openSpotInNotebook}
          />
        </View>
      </View>
    );
  };

  return (
    <>
      {isEmpty(getSpotsWithSamples()) ? renderNoSamplesText() : renderSamples()}
    </>
  );
};

export default Samples;
