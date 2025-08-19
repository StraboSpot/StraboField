import React, {useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './documentation.styles';

const ModalHeader = ({currentPage, totalPages, onClose, onJumpToPage}) => {
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
          <Text style={styles.jumpText}>Jump</Text>
        </TouchableOpacity>}
        <Text style={styles.pageText}>
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name={'close'} size={24} color={'#333'}/>
        </TouchableOpacity>
      </View>
      <Overlay
        visible={pickerVisible}
        animationType={'fade'}
        overlayStyle={styles.pickerContainer}
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
          />
          <Button
            title={'Cancel'}
            type={'clear'}
            onPress={() => setPickerVisible(false)}
            style={styles.cancelButton}
            containerStyle={styles.pickerCancelButtonContainer}
          />
        </View>
      </Overlay>
    </>
  );
};

export default ModalHeader;
