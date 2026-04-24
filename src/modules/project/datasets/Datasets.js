import React, {useEffect, useState} from 'react';

import {useSelector} from 'react-redux';

import DatasetDetail from './DatasetDetail';
import DatasetsOverview from './DatasetsOverview';

const Datasets = () => {
  /* Data Hooks */

  const datasets = useSelector(state => state.project.datasets);
  const {isOwner} = useSelector(state => state.project.project);

  /* Local State */

  const [datasetToView, setDatasetToView] = useState(null);
  const [isAddDatasetModalVisible, setIsAddDatasetModalVisible] = useState(false);

  /* Side Effects */

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
    : (
      <DatasetsOverview
        isAddDatasetModalVisible={isAddDatasetModalVisible}
        setDatasetToView={setDatasetToView}
        setIsAddDatasetModalVisible={setIsAddDatasetModalVisible}
      />
    );
};

export default Datasets;
