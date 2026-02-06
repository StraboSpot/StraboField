import React, {useState} from 'react';
import {Text, View} from 'react-native';

import SamplesSectionList from './SamplesSectionList';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({checkedItems, isCheckedList, openSpotInNotebook, updateSpotsInMapExtent}) => {
  const {getActiveSpotsObj} = useSpots();

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);
  const spotsWithSamples = activeSpots.filter(spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);

  const [isReverseSort, setIsReverseSort] = useState(false);
  const [spotsWithSamplesSorted, setSpotsWithSamplesSorted] = useState(spotsWithSamples);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  const renderNoSamplesText = () => {
    return <ListEmptyText text={'No Samples in Active Datasets'}/>;
  };

  const renderSamples = () => {
    const sampleSpotsSorted = isReverseSort ? spotsWithSamplesSorted.reverse() : spotsWithSamplesSorted;
    let count = 0;
    let samples = [];
    let dataSectioned = sampleSpotsSorted.map((s) => {
      count += s.properties.samples.length;
      samples = [...samples, ...s.properties.samples];
      return {title: s.properties.name, data: s.properties.samples, spot: s};
    });
    let sampleSpotsCount = 0;
    const totalSamplesCount = count + sampleSpotsCount;

    return (
      <View style={{flex: 1}}>
        <SpotFilters
          activeSpots={spotsWithSamplesSorted}
          isSamplesSearch={true}
          setIsReverseSort={setIsReverseSort}
          setSpotsSorted={setSpotsWithSamplesSorted}
          setTextNoSpots={setTextNoSpots}
          updateSpotsInMapExtent={updateSpotsInMapExtent}
        />
        <View style={{flex: 1}}>
          <Text style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
            Found {totalSamplesCount + (totalSamplesCount === 1 ? ' Sample' : ' Samples')} in Active Datasets
          </Text>
          <SamplesSectionList
            checkedItems={checkedItems}
            dataSectioned={dataSectioned}
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
      {isEmpty(spotsWithSamplesSorted) ? renderNoSamplesText() : renderSamples()}
    </>
  );
};

export default Samples;
