import React, {useState} from 'react';
import {Text, View} from 'react-native';

import TablesData from './TablesData';
import UrlData from './URLData';
import useExternalData from './useExternalData';
import {isEmpty} from '../../shared/Helpers';
import DeleteConformationDialogBox from '../../shared/ui/DeleteConformationDialogBox';

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
        title={`${itemToDelete.type.toUpperCase()} to delete`}
        isVisible={isDeleteConfirmModalVisible}
        deleteOverlay={() => deleteSelection()}
        cancel={() => setIsDeleteConfirmModalVisible(false)}
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
          spot={spot}
          editable={editable}
          initializeDelete={(type, item) => initializeDelete(type, item)}
        />
      )}
      {!urlData && (
        <TablesData
          spot={spot}
          editable={editable}
          initializeDelete={(type, item) => initializeDelete(type, item)}
        />
      )}
      {!isEmpty(itemToDelete) && renderDeleteConformation()}
    </View>
  );
}

export default DataWrapper;
