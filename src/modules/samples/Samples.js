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

  const renderSamples = () => {
    const sampleSpotsSorted = isReverseSort ? spotsWithSamplesSorted.reverse() : spotsWithSamplesSorted;
    let samplesCount = 0;
    const dataSectioned = sampleSpotsSorted.map((s) => {
      samplesCount += s.properties.samples.length;
      return {title: s.properties.name, data: s.properties.samples, spot: s};
    });

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
            Found {samplesCount + (samplesCount === 1 ? ' Sample' : ' Samples')} in Active Datasets
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

  if (isEmpty(spotsWithSamplesSorted)) return <ListEmptyText text={'No Samples in Active Datasets'}/>;
  return renderSamples();
};

export default Samples;