import React, {useEffect, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {setActiveDatasets, setTargetDataset} from '../projects.slice';
import DatasetDetail from './DatasetDetail';
import DatasetsOverview from './DatasetsOverview';

const Datasets = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeDatasetsIds = useSelector(state => state.project.activeDatasetsIds);
  const datasets = useSelector(state => state.project.datasets);
  const {isOwner} = useSelector(state => state.project.project);
  const targetDatasetId = useSelector(state => state.project.targetDatasetId);

  /* Local State */

  const [datasetToView, setDatasetToView] = useState(null);
  const [isAddDatasetModalVisible, setIsAddDatasetModalVisible] = useState(false);

  /* Side Effects */

  useEffect(() => {
    console.log('UE DatasetsPage [datasets]', datasets);
    if (Object.values(datasets).length > 0 && !isEmpty(Object.values(datasets)[0])) {
      if (activeDatasetsIds.length === 0) {
        dispatch(setActiveDatasets({bool: true, dataset: Object.values(datasets)[0].id}));
        dispatch(setTargetDataset(Object.values(datasets)[0].id));
      }
      else if (!targetDatasetId && !Object.values(datasets)[0].isReadOnly) {
        dispatch(setTargetDataset(activeDatasetsIds[0]));
      }
    }
  }, [datasets]);

  useEffect(() => {
    if (isOwner === false) {
      const hasWritableDataset = Object.values(datasets).some(d => d.isReadOnly);
      if (!hasWritableDataset) setIsAddDatasetModalVisible(true);
    }
  }, []);

  /* Logic Helpers */

  const closeDetailView = () => setDatasetToView(null);

  /* View */

  return datasetToView ? <DatasetDetail closeDetailView={closeDetailView} dataset={datasetToView}/>
    : <DatasetsOverview
      isAddDatasetModalVisible={isAddDatasetModalVisible}
      setDatasetToView={setDatasetToView}
      setIsAddDatasetModalVisible={setIsAddDatasetModalVisible}
    />;
};

export default Datasets;
