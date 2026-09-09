import React, {useState} from 'react';

import DatasetDetail from './DatasetDetail';
import DatasetsOverview from './DatasetsOverview';

const Datasets = () => {
  /* Local State */

  const [datasetToView, setDatasetToView] = useState(null);
  const [isAddDatasetModalVisible, setIsAddDatasetModalVisible] = useState(false);

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
