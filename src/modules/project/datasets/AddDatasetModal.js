import React, {useState} from 'react';

import {isEmpty} from '../../../shared/helpers';
import TextInputModal from '../../../shared/ui/TextInputModal';
import useProject from '../useProject';

const DatasetsPage = ({isAddDatasetModalVisible, setIsAddDatasetModalVisible}) => {
  /* Data Hooks */

  const {addDataset} = useProject();

  /* Local State */

  const [datasetName, setDatasetName] = useState(null);

  /* Derived Variables */

  // A dataset is picked out of the list by its name, so Add is held until it is named, as renaming one is
  const isNameInvalid = isEmpty(datasetName?.trim());

  /* Event Handlers */

  const onAddDataset = async () => {
    const addedDataset = await addDataset(datasetName);
    console.log(addedDataset);
    setDatasetName('');
    setIsAddDatasetModalVisible(false);
  };

  // Clear the name as an add does, so opening the modal again starts empty rather than on an abandoned name
  const onCancelPressed = () => {
    setDatasetName('');
    setIsAddDatasetModalVisible(false);
  };

  /* View */

  return (
    <TextInputModal
      dialogTitle={'Add a Dataset'}
      disabled={isNameInvalid}
      errorMessage={isNameInvalid ? 'Dataset name cannot be empty' : undefined}
      onActionPressed={onAddDataset}
      onCancelPress={onCancelPressed}
      onChangeText={text => setDatasetName(text)}
      value={datasetName}
      visible={isAddDatasetModalVisible}
    />
  );
};

export default DatasetsPage;
