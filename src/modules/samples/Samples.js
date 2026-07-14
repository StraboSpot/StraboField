import React, {useState} from 'react';
import {Text, View} from 'react-native';

import SamplesSectionList from './SamplesSectionList';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import {useSpots} from '../spots';
import SpotQuery from '../spots/SpotQuery';

const Samples = ({checkedItems, isCheckedList, openSpotInNotebook}) => {
  /* Data Hooks */

  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);
  const spotsWithSamples = activeSpots.filter(spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);

  const [scopeText, setScopeText] = useState('');
  const [spotsWithSamplesSorted, setSpotsWithSamplesSorted] = useState(spotsWithSamples);

  /* Derived Variables */

  const scopeSuffix = scopeText ? ` in ${scopeText}` : '';
  const filterPrefix = scopeText ? 'Filtered Results: ' : '';

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
      <SpotQuery
        activeSpots={spotsWithSamples}
        isSamplesSearch={true}
        setScopeText={setScopeText}
        setSpotsSorted={setSpotsWithSamplesSorted}
      />
      {isEmpty(spotsWithSamplesSorted) ? <ListEmptyText text={`${filterPrefix}No Samples${scopeSuffix}`}/> : (
        <View style={{flex: 1}}>
          <Text
            style={[commonStyles.standardDescriptionText, {alignSelf: 'center', padding: 10, textAlign: 'center'}]}>
            {filterPrefix}{samplesCount + (samplesCount === 1 ? ' Sample' : ' Samples')}{scopeSuffix}
          </Text>
          <SamplesSectionList
            checkedItems={checkedItems}
            dataSectioned={dataSectioned}
            isCheckedList={isCheckedList}
            listEmptyText={`${filterPrefix}No Samples${scopeSuffix}`}
            openSpotInNotebook={openSpotInNotebook}
          />
        </View>
      )}
    </View>
  );
};

export default Samples;
