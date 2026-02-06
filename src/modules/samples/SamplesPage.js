import React, {useEffect} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SamplesList from './SamplesList';
import {isEmpty} from '../../shared/Helpers';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import BasicPageDetail from '../page/BasicPageDetail';
import Overview from '../page/Overview';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

const SamplesPage = ({isReadOnly, page, selectedSample, setSelectedSample}) => {
  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

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

  const renderSampleDetail = () => {
    if (spot.properties?.isSample && !selectedSample) return <Overview/>;
    else {
      return (
        <BasicPageDetail
          closeDetailView={closeDetailView}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selectedSample}
        />
      );
    }
  };

  const renderSamplesMain = () => {
    return (
      <View style={{flex: 1}}>
        <NotebookPageHeader
          onPressAdd={() => dispatch(setModalVisible({modal: page.key}))}
          pageTitle={page.label}
          showAddButton={!isReadOnly}
        />
        <SamplesList onPress={editSample}/>
      </View>
    );
  };

  return (
    <>
      {isEmpty(selectedSample) ? renderSamplesMain() : renderSampleDetail()}
    </>
  );
};

export default SamplesPage;
