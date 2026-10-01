import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import LinkedSampleDataView from './LinkedSampleDataView';
import {SAMPLE_DETAIL_TABS} from './samples.constants';
import SamplesList from './SamplesList';
import {isEmpty} from '../../shared/helpers';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible, setRequestedSampleDetailTab} from '../notebook-panel/notebook.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import SubpageTabs from '../page/SubpageTabs';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

const SamplesPage = ({
                       isReadOnly,
                       page,
                       registerGetValues,
                       registerSaveChanges,
                       selectedSample,
                       setSelectedSample,
                     }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const requestedTabKey = useSelector(state => state.notebook.requestedSampleDetailTab);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const [selectedTabKey, setSelectedTabKey] = useState(requestedTabKey ?? SAMPLE_DETAIL_TABS[0].key);

  /* Derived Variables */

  // For a rich sample the spot itself is the sample, so show its detail immediately rather than
  // waiting for the effect to set selectedSample (which briefly flashes the samples list).
  const sampleToDisplay = spot.properties?.isSample && spot.properties?.samples?.length > 0 ? spot.properties.samples[0]
    : selectedSample;
  // Field is always there, and each other app's tab only once its data has been kept on the Sample Spot by linking
  const tabs = SAMPLE_DETAIL_TABS.filter(tab => !tab.dataKey || !isEmpty(spot.properties?.[tab.dataKey]));
  const selectedTab = tabs.find(tab => tab.key === selectedTabKey) ?? tabs[0];

  /* Side Effects */

  useEffect(() => {
    console.log('UE SamplesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  // Every sample opens on its Field tab, unless it was opened for another one, which is asked for only that once
  useEffect(() => {
    setSelectedTabKey(requestedTabKey ?? SAMPLE_DETAIL_TABS[0].key);
    if (requestedTabKey) dispatch(setRequestedSampleDetailTab(undefined));
  }, [spot.properties?.id, sampleToDisplay?.id]);

  useEffect(() => {
    console.log('UE SamplesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (spot.properties?.isSample && spot.properties?.samples?.length > 0) {
      setSelectedSample(spot.properties.samples[0]);
    }
    else if (isEmpty(selectedAttributes)) setSelectedSample({});
    else setSelectedSample(selectedAttributes[0]);
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const closeDetailView = () => {
    if (spot.properties?.isSample) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    console.log('closeDetailView');
    setSelectedSample({});
  };

  const editSample = (sampleToEdit) => {
    if (sampleToEdit.properties?.isSample) {
      dispatch(setSelectedSpot(sampleToEdit));
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    else {
      setSelectedSample(sampleToEdit);
      dispatch(setSelectedAttributes([sampleToEdit]));
      dispatch(setModalVisible({modal: null}));
    }
  };

  /* Render Functions */

  const renderSampleDetail = () => (
    <BasicPageDetail
      PageTabsComponent={tabs.length > 1 && (
        <SubpageTabs
          formCategory={'general'}
          onPress={i => setSelectedTabKey(tabs[i].key)}
          selectedIndex={tabs.indexOf(selectedTab)}
          subpageKeys={tabs.map(tab => tab.key)}
        />
      )}
      closeDetailView={closeDetailView}
      isReadOnly={isReadOnly}
      page={page}
      registerGetValues={registerGetValues}
      registerSaveChanges={registerSaveChanges}
      selectedFeature={sampleToDisplay}
      tabContent={selectedTab.dataKey && <LinkedSampleDataView data={spot.properties[selectedTab.dataKey]}/>}
    />
  );

  const renderSamplesMain = () => (
    <View style={{flex: 1}}>
      <PageHeader
        onPressAdd={() => dispatch(setModalVisible({modal: page.key}))}
        pageTitle={page.label}
        showAddButton={!isReadOnly}
      />
      <SamplesList
        isShowIGSN
        onPress={editSample}
        onPressEmpty={!isReadOnly && (() => dispatch(setModalVisible({modal: page.key})))}
      />
    </View>
  );

  /* View */

  if (isEmpty(sampleToDisplay)) return renderSamplesMain();

  return renderSampleDetail();
};

export default SamplesPage;
