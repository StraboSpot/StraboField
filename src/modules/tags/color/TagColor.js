import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import TagColorPickerModal from './TagColorPickerModal';
import {formStyles} from '../../form';

const TagColor = ({tempColor, onTempColorChange}) => {
  /* Local State */

  const [isColorPickerModalVisible, setIsColorPickerModalVisible] = useState(false);

  /* View */

  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
        <Text style={[formStyles.fieldLabel, {flex: 0, paddingRight: 10}]}>Color</Text>
        <Icon
          color={tempColor}
          containerStyle={{borderWidth: 1}}
          name={tempColor ? 'square' : 'x-square'}
          onPress={() => setIsColorPickerModalVisible(true)}
          size={30}
          type={tempColor ? 'ionicon' : 'feather'}
        />
      </View>

      {/* Modals */}
      {isColorPickerModalVisible && (
        <TagColorPickerModal
          closeModal={() => setIsColorPickerModalVisible(false)}
          onColorSelect={onTempColorChange}
          tempColor={tempColor}
        />
      )}
    </>
  );
};

export default TagColor;
