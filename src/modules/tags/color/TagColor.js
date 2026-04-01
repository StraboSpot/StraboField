import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import TagColorPickerModal from './TagColorPickerModal';
import {SMALL_TEXT_SIZE} from '../../../shared/styles.constants';

const TagColor = ({colorLabel}) => {
  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);

  /* Local State */

  const [isColorPickerModalVisible, setIsColorPickerModalVisible] = useState(false);

  /* View */

  return (
    <>
      <View style={{width: 100, position: 'absolute', right: 0, top: 0, alignItems: 'center'}}>
        <Text style={{paddingBottom: 5, paddingTop: 5, fontSize: SMALL_TEXT_SIZE}}>{colorLabel} Color</Text>
        <Icon
          color={selectedTag.color}
          containerStyle={{borderWidth: 1}}
          name={selectedTag.color ? 'square' : 'x-square'}
          onPress={() => setIsColorPickerModalVisible(true)}
          size={30}
          type={selectedTag.color ? 'ionicon' : 'feather'}
        />
      </View>

      {/* Modals */}
      {isColorPickerModalVisible && <TagColorPickerModal closeModal={() => setIsColorPickerModalVisible(false)}/>}
    </>
  );
};

export default TagColor;
