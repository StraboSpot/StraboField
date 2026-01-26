import React, {useState} from 'react';
import {Text, View} from 'react-native';

import TablesData from './TablesData';
import UrlData from './URLData';
import useExternalData from './useExternalData';
import {isEmpty} from '../../shared/Helpers';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';

function DataWrapper({
                       editable,
                       spot,
                       urlData,
                     }) {
  const [itemToDelete, setItemToDelete] = useState({});
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const {deleteCSV, deleteURL} = useExternalData();

  const deleteSelection = () => {
    itemToDelete.type === 'url' ? deleteURL(itemToDelete.item) : deleteCSV(itemToDelete.item);
    setIsDeleteConfirmModalVisible(false);
  };

  const initializeDelete = (type, whatToDelete) => {
    setItemToDelete({type: type, item: whatToDelete});
    setIsDeleteConfirmModalVisible(true);
  };

  const renderDeleteConformation = () => {
    const title = itemToDelete?.type === 'url' ? `${itemToDelete.item}` : `${itemToDelete.item.name}`;
    return (
      <DeleteConformationDialogBox
        overlayStyleOverride={{maxHeight: '25%'}}
        headerTitle={`Delete ${itemToDelete.type.toUpperCase()}?`}
        isVisible={isDeleteConfirmModalVisible}
        onActionPressed={() => deleteSelection()}
        onCancelPress={() => setIsDeleteConfirmModalVisible(false)}
      >
        <Text>Are you sure you want to delete</Text>
        <Text>{title}?</Text>
      </DeleteConformationDialogBox>
    );
  };

  return (
    <View style={{flex: 1}}>
      {urlData && (
        <UrlData
          editable={editable}
          initializeDelete={(type, item) => initializeDelete(type, item)}
          spot={spot}
        />
      )}
      {!urlData && (
        <TablesData
          editable={editable}
          initializeDelete={(type, item) => initializeDelete(type, item)}
          spot={spot}
        />
      )}
      {!isEmpty(itemToDelete) && renderDeleteConformation()}
    </View>
  );
}

export default DataWrapper;
