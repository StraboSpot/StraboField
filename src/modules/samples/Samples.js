import React, {useState} from 'react';
import {Text, View} from 'react-native';

import SamplesSectionList from './SamplesSectionList';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';
import SpotFilters from '../spots/SpotFilters';

const Samples = ({checkedItems, isCheckedList, openSpotInNotebook, updateSpotsInMapExtent}) => {
  /* Data Hooks */

  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);
  const spotsWithSamples = activeSpots.filter(spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);

  const [spotsWithSamplesSorted, setSpotsWithSamplesSorted] = useState(spotsWithSamples);
  const [textNoSpots, setTextNoSpots] = useState('No Spots in Active Datasets');

  /* Derived Variables */

  let samplesCount = 0;
  let dataSectioned;
  if (!isEmpty(spotsWithSamplesSorted)) {
    dataSectioned = spotsWithSamplesSorted.map((s) => {
      samplesCount += s.properties?.samples?.length;
      return {title: s.properties?.name, data: s.properties?.samples, spot: s};
    });
  }

  /* View */

  return (
    <View style={{flex: 1}}>
      <SpotFilters
        activeSpots={spotsWithSamples}
        isSamplesSearch={true}
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
