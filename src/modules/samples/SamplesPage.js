import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SamplesList from './SamplesList';
import {isEmpty} from '../../shared/Helpers';
import {setModalVisible} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import BasicPageDetail from '../page/BasicPageDetail';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedAttributes} from '../spots/spots.slice';

const SamplesPage = ({isReadOnly, page}) => {
  const dispatch = useDispatch();

  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedSample, setSelectedSample] = useState({});

  useEffect(() => {
    console.log('UE SamplesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE SamplesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (spot.properties?.isSample && spot.properties?.samples?.length > 0) {
      setSelectedSample(spot.properties.samples[0]);
      setIsDetailView(true);
    }
    else if (isEmpty(selectedAttributes)) setSelectedSample({});
    else {
      setSelectedSample(selectedAttributes[0]);
      setIsDetailView(true);
    }
  }, [selectedAttributes, spot]);

  const closeDetailView = () => {
    if (spot.properties?.isSample) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    console.log('closeDetailView');
    setIsDetailView(false);
  };

  const editSample = (sample) => {
    setIsDetailView(true);
    setSelectedSample(sample);
    dispatch(setModalVisible({modal: null}));
  };

  const renderSamplesDetail = () => {
    return (
      <>
        <BasicPageDetail
          closeDetailView={closeDetailView}
          isReadOnly={isReadOnly}
          page={page}
          selectedFeature={selectedSample}
        />
      </>
    );
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
      {isDetailView ? renderSamplesDetail() : renderSamplesMain()}
    </>
  );
};

export default SamplesPage;
