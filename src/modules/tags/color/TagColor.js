import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import TagColorPickerModal from './TagColorPickerModal';
import {formStyles} from '../../form';

const TagColor = () => {
  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);

  /* Local State */

  const [isColorPickerModalVisible, setIsColorPickerModalVisible] = useState(false);

  /* View */

  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: 40}}>
        <Text style={[formStyles.fieldLabel, {flex: 0, paddingRight: 10}]}>Color</Text>
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
