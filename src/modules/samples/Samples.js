import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import SamplesSectionList from './SamplesSectionList';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({checkedItems, isCheckedList, openSpotInNotebook, updateSpotsInMapExtent}) => {
  /* Data Hooks */

  const sortedView = useSelector(state => state.mainMenu.sortedView);

  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const [isReverseSort, setIsReverseSort] = useState(false);

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);
  const spotsWithSamples = activeSpots.filter(spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);

  const [spotsWithSamplesSorted, setSpotsWithSamplesSorted] = useState(spotsWithSamples);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  /* Derived Variables */

  const sampleSpotsSorted = isReverseSort ? spotsWithSamplesSorted.reverse() : spotsWithSamplesSorted;
  let samplesCount = 0;
  let dataSectioned;
  if (!isEmpty(sampleSpotsSorted)) {
    dataSectioned = sampleSpotsSorted.map((s) => {
      samplesCount += s.properties?.samples?.length;
      return {title: s.properties?.name, data: s.properties?.samples, spot: s};
    });
  }

  /* Side Effects */

  useEffect(() => {
    setSpotsWithSamplesSorted(spotsWithSamples);
  }, [sortedView]);

  /* View */

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
      {isEmpty(spotsWithSamplesSorted) ? <ListEmptyText text={'No Samples in Active Datasets'}/> : (
        <View style={{flex: 1}}>
          <Text
            style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
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
      )}
    </View>
  );
};

export default Samples;
