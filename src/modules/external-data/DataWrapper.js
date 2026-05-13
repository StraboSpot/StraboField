import React, {useState} from 'react';
import {Text, View} from 'react-native';

import TablesData from './TablesData';
import UrlData from './URLData';
import useExternalData from './useExternalData';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {WarningModal} from '../../shared/ui/modals';

function DataWrapper({
                       editable,
                       spot,
                       urlData,
                     }) {
  /* Data Hooks */

  const {deleteCSV, deleteURL} = useExternalData();

  /* Local State */

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({});

  /* Logic Helpers */

  const deleteSelection = () => {
    itemToDelete.type === 'url' ? deleteURL(itemToDelete.item) : deleteCSV(itemToDelete.item);
    setIsDeleteConfirmModalVisible(false);
  };

  const initializeDelete = (type, whatToDelete) => {
    setItemToDelete({type: type, item: whatToDelete});
    setIsDeleteConfirmModalVisible(true);
  };

  /* Render Functions */

  const renderDeleteConformation = () => {
    const title = itemToDelete?.type === 'url' ? `${itemToDelete.item}` : `${itemToDelete.item.name}`;
    return (
      <WarningModal
        confirmText={'Delete'}
        isVisible={isDeleteConfirmModalVisible}
        onCancelPress={() => setIsDeleteConfirmModalVisible(false)}
        onConfirmPress={deleteSelection}
        title={'Delete .CSV?'}
      >
        <Text>Are you sure you want to delete {'\n'}
          <Text style={commonStyles.textBold}>{title}?</Text>
        </Text>
      </WarningModal>
    );
  };

  /* View */

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
