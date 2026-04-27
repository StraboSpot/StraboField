import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SamplesList from './SamplesList';
import {isEmpty} from '../../shared/Helpers';
import {setModalVisible} from '../home/home.slice';
import BasicPageDetail from '../page/BasicPageDetail';
import PageHeader from '../page/PageHeader';
import {setSelectedAttributes} from '../spots/spots.slice';

const SamplesPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  /* Local State */

  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedSample, setSelectedSample] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('UE SamplesPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE SamplesPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (isEmpty(selectedAttributes)) setSelectedSample({});
    else {
      const sample = selectedAttributes[0];
      const spotSamples = spot?.properties?.samples || [];
      if (spotSamples.some(s => s.id === sample?.id)) {
        setSelectedSample(sample);
        setIsDetailView(true);
      }
      else {
        setSelectedSample({});
        dispatch(setSelectedAttributes([]));
      }
    }
  }, [selectedAttributes, spot]);

  /* Logic Helpers */

  const editSample = (sample) => {
    setIsDetailView(true);
    setSelectedSample(sample);
    dispatch(setModalVisible({modal: null}));
  };

  /* Render Functions */

  const renderSamplesDetail = () => {
    return (
      <>
        <BasicPageDetail
          closeDetailView={() => {
            console.log('closeDetailView');
            setIsDetailView(false);
          }}
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
        <PageHeader
          onPressAdd={() => dispatch(setModalVisible({modal: page.key}))}
          pageTitle={page.label}
          showAddButton={!isReadOnly}
        />
        <SamplesList
          onPress={editSample}
          onPressEmpty={!isReadOnly && (() => dispatch(setModalVisible({modal: page.key})))}
        />
      </View>
    );
  };

  /* View */

  return (
    <>
      {isDetailView ? renderSamplesDetail() : renderSamplesMain()}
    </>
  );
};

export default SamplesPage;
