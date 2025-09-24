import React, {useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './documentation.styles';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const DocumentationModalHeader = ({currentPage, totalPages, onClose, onJumpToPage}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelectPage = (page) => {
    setPickerVisible(false);
    onJumpToPage(page);
  };

  const pageNumbers = Array.from({length: totalPages}, (_, i) => i + 1);

  return (
    <>
      <View style={styles.headerContainer}>
        {totalPages > 1 && <TouchableOpacity onPress={() => setPickerVisible(true)} style={styles.jumpButton}>
          <Text style={styles.jumpText}>Jump to page</Text>
        </TouchableOpacity>}
        <Text style={styles.pageText}>
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons color={'#333'} name={'close'} size={24}/>
        </TouchableOpacity>
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
      {/*</Overlay>*/}
    </>
  );
};

export default DocumentationModalHeader;
