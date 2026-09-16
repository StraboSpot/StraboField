import React, {useEffect} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SamplesList from './SamplesList';
import {isEmpty} from '../../shared/helpers';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

const SamplesPage = ({isReadOnly, page, registerGetValues, selectedSample, setSelectedSample}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Derived Variables */

  // For a rich sample the spot itself is the sample, so show its detail immediately rather than
  // waiting for the effect to set selectedSample (which briefly flashes the samples list).
  const sampleToDisplay = spot.properties?.isSample && spot.properties?.samples?.length > 0 ? spot.properties.samples[0]
    : selectedSample;

  /* Side Effects */

  useEffect(() => {
    console.log('UE SamplesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

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
      closeDetailView={closeDetailView}
      isReadOnly={isReadOnly}
      page={page}
      registerGetValues={registerGetValues}
      selectedFeature={sampleToDisplay}
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
