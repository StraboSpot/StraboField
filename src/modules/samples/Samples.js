import React, {useState} from 'react';
import {View} from 'react-native';

import SamplesSectionList from './SamplesSectionList';
import {isEmpty} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ActiveDatasetsSummary from '../project/datasets/ActiveDatasetsSummary';
import SpotQuery from '../spots/SpotQuery';
import useSpots from '../spots/useSpots';

const Samples = ({canPickReadOnly, checkedItems, isCheckedList, onChecked, openDatasetsPage, openSpotInNotebook}) => {
  /* Data Hooks */

  const {getActiveSpotsObj} = useSpots();

  /* Local State */

  const activeSpotsObj = getActiveSpotsObj();
  const activeSpots = Object.values(activeSpotsObj);
  const spotsWithSamples = activeSpots.filter(spot => !isEmpty(spot.properties.samples) && !spot.properties.isSample);

  const [scopeText, setScopeText] = useState('');
  const [spotsWithSamplesSorted, setSpotsWithSamplesSorted] = useState(spotsWithSamples);

  /* Derived Variables */

  const scopeSuffix = scopeText ? ` ${scopeText}` : '';
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
      {isEmpty(spotsWithSamplesSorted) ? (
        <>
          <ActiveDatasetsSummary openDatasetsPage={openDatasetsPage}/>
          <ListEmptyText text={`No Samples${scopeSuffix}`}/>
        </>
      ) : (
        <View style={{flex: 1}}>
          <ActiveDatasetsSummary
            countText={`${filterPrefix}${samplesCount + (samplesCount === 1 ? ' Sample' : ' Samples')}${scopeSuffix}`}
            openDatasetsPage={openDatasetsPage}
          />
          <SamplesSectionList
            canPickReadOnly={canPickReadOnly}
            checkedItems={checkedItems}
            dataSectioned={dataSectioned}
            isCheckedList={isCheckedList}
            listEmptyText={`No Samples${scopeSuffix}`}
            onChecked={onChecked}
            openSpotInNotebook={openSpotInNotebook}
          />
        </View>
      )}
    </View>
  );
};

export default Samples;
