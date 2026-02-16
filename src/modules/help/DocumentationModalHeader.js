import React, {useState} from 'react';
import {FlatList, Platform, Text, TouchableOpacity, View} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './documentation.styles';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const DocumentationModalHeader = ({currentPage, totalPages, onClose, onJumpToPage}) => {
  /* Data Hooks / State */

  const [pickerVisible, setPickerVisible] = useState(false);

  /* Derived Variables */

  const pageHeader = Platform.OS === 'ios' ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage}`;
  const pageNumbers = Array.from({length: totalPages}, (_, i) => i + 1);

  /* Event Handlers */

  const handleSelectPage = (page) => {
    setPickerVisible(false);
    onJumpToPage(page);
  };

  /* View */

  return (
    <>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
          <Ionicons color={'#333'} name={'arrow-back-outline'} size={24}/>
        </TouchableOpacity>
        <Text style={styles.pageText}>{pageHeader}</Text>
        {totalPages > 1 && <TouchableOpacity onPress={() => setPickerVisible(true)}>
          <Text style={styles.jumpText}>Jump to page</Text>
        </TouchableOpacity>}
      </View>
      <ModalWrapper
        closeModal={() => setPickerVisible(false)}
        headerTitle={'Jump to Page'}
        isVisible={pickerVisible}
        overlayStyleOverride={styles.pickerContainer}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={styles.pickerOverlay}>
          <FlatList
            data={pageNumbers}
            keyExtractor={item => item.toString()}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => handleSelectPage(item)} style={styles.pageOption}>
                <Text style={styles.pageOptionText}>Page {item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
            style={styles.pickerList}
          />
        </View>
      </ModalWrapper>
    </>
  );
};

export default DocumentationModalHeader;
