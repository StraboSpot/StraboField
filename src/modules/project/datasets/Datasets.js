import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {setActiveDatasets, setTargetDataset} from '../projects.slice';
import DatasetDetail from './DatasetDetail';
import DatasetsOverview from './DatasetsOverview';

const Datasets = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets);
  const readOnlyDatasetsIds = useSelector(state => state.project.readOnlyDatasetsIds) || [];
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  /* Local State */

  const [datasetToView, setDatasetToView] = useState(null);

  /* Side Effects */

  useEffect(() => {
    console.log('UE DatasetsPage [datasets]', datasets);
    if (Object.values(datasets).length > 0 && !isEmpty(Object.values(datasets)[0])) {
      // New Spots are filed into the target, so only a writable dataset may be picked as one. Which
      // dataset is shown on the map is a separate question - a read only one is still worth seeing
      const writableDatasets = Object.values(datasets).filter(
        dataset => !readOnlyDatasetsIds.includes(dataset.id));
      if (activeDatasetsIds.length === 0) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(datasets)[0].id}));
        if (!isEmpty(writableDatasets)) dispatch(setTargetDataset(writableDatasets[0].id));
      }
      else if (!targetDatasetId) {
        const activeWritableDataset = writableDatasets.find(dataset => activeDatasetsIds.includes(dataset.id));
        if (activeWritableDataset) dispatch(setTargetDataset(activeWritableDataset.id));
      }
    }
  }, [datasets]);

  /* Logic Helpers */

  const closeDetailView = () => setDatasetToView(null);

  /* View */

  return datasetToView ? <DatasetDetail closeDetailView={closeDetailView} dataset={datasetToView}/>
    : <DatasetsOverview setDatasetToView={setDatasetToView}/>;
};

export default Datasets;
