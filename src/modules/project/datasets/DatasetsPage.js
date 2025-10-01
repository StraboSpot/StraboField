import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {setActiveDatasets, setTargetDataset} from '../projects.slice';
import DatasetDetail from './DatasetDetail';
import DatasetsOverview from './DatasetsOverview';

const DatasetsPage = () => {

  const [datasetToView, setDatasetToView] = useState(null);

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  useEffect(() => {
    console.log('UE DatasetsPage [datasets]', datasets);
    if (Object.values(datasets).length > 0 && !isEmpty(Object.values(datasets)[0])) {
      if (activeDatasetsIds.length === 0) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(datasets)[0].id}));
        dispatch(setTargetDataset(Object.values(datasets)[0].id));
      }
      else if (!targetDatasetId) dispatch(setTargetDataset(activeDatasetsIds[0]));
    }
  }, [datasets]);

  const closeDetailView = () => setDatasetToView(null);

  return datasetToView ? <DatasetDetail closeDetailView={closeDetailView} dataset={datasetToView}/>
    : <DatasetsOverview setDatasetToView={setDatasetToView}/>;
};

export default DatasetsPage;
