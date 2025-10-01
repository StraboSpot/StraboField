import React, {useState} from 'react';

import TextInputModal from '../../../shared/ui/TextInputModal';
import useProject from '../useProject';

const DatasetsPage = ({isAddDatasetModalVisible, setIsAddDatasetModalVisible}) => {
  const {addDataset} = useProject();

  const [datasetName, setDatasetName] = useState(null);

  const onAddDataset = async () => {
    const addedDataset = await addDataset(datasetName);
    console.log(addedDataset);
    setDatasetName('');
    setIsAddDatasetModalVisible(false);
  };

  return (
    <TextInputModal
      dialogTitle={'Add a Dataset'}
      onActionPressed={onAddDataset}
      onCancelPress={() => setIsAddDatasetModalVisible(false)}
      onChangeText={text => setDatasetName(text)}
      value={datasetName}
      visible={isAddDatasetModalVisible}
    />
  );
};

export default DatasetsPage;
