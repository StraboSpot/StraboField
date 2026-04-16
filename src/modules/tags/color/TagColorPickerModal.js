import React, {useRef, useState} from 'react';
import {Pressable, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import {COLOR_CHOICES} from './tagColor.constants';
import {getRGBString, isValidHexColor, rgbToHex} from './tagColor.helpers';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/Helpers';
import {BLACK, WHITE} from '../../../shared/styles.constants';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import Spacer from '../../../shared/ui/Spacer';
import {TextInputField} from '../../form';

const TagColorPickerModal = ({closeModal, onColorSelect, tempColor}) => {
  /* Local State */

  const formRef = useRef(null);

  const [hexColor, setHexColor] = useState(tempColor || undefined);

  /* Event Handlers */

  const handleColorChanged = (field, value) => {
    if (field === 'rgb') {
      formRef.current.setFieldValue('rgb', value);
      const [r, g, b] = value.replaceAll(' ', '').split(',');
      const hexToTest = rgbToHex(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10));
      if (isValidHexColor(hexToTest)) {
        formRef.current.setFieldValue('hex', hexToTest);
        setHexColor(hexToTest);
      }
      else {
        formRef.current.setFieldValue('hex', undefined);
        setHexColor(undefined);
      }
    }
    else if (field === 'hex') {
      formRef.current.setFieldValue('hex', value);
      if (isValidHexColor(value)) {
        formRef.current.setFieldValue('rgb', getRGBString(value));
        setHexColor(value);
      }
      else {
        formRef.current.setFieldValue('rgb', undefined);
        setHexColor(undefined);
      }
    }
  };

  /* Logic Helpers */

  const clearColor = () => {
    onColorSelect(undefined);
    closeModal();
  };

  const selectColor = () => {
    onColorSelect(hexColor);
    closeModal();
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerTitle={'Select a Custom Color'}
      isVisible
      overlayStyleOverride={{width: 400}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <View>
        {COLOR_CHOICES.map((colorRow) => {
          return (
            <View key={colorRow} style={overlayStyles.tagColorPickerContent}>
              {colorRow.map((colorChoice) => {
                return (
                  <Pressable
                    key={colorChoice}
                    onPress={() => handleColorChanged('hex', colorChoice)}
                    style={{
                      ...overlayStyles.tagColorPickerColorItem,
                      backgroundColor: colorChoice,
                      borderColor: hexColor?.toUpperCase() === colorChoice?.toUpperCase() ? BLACK : WHITE,
                    }}
                  />
                );
              })}
            </View>
          );
        })}
        <Spacer/>
        <Formik
          initialValues={{hex: hexColor, rgb: getRGBString(hexColor)}}
          innerRef={formRef}
          onSubmit={() => console.log('Submitting form...')}
        >
          {() => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={TextInputField}
                    key={'hex'}
                    label={'Hex'}
                    name={'hex'}
                    onMyChange={handleColorChanged}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={TextInputField}
                    key={'rgb'}
                    label={'RGB'}
                    name={'rgb'}
                    onMyChange={handleColorChanged}
                  />
                </ListItem.Content>
              </ListItem>
            </View>
          )}
        </Formik>
        <Spacer/>
        <ActionButton
          disabled={isEmpty(hexColor)}
          onPress={selectColor}
          title={'Select Color'}
        />
        <Spacer/>
        <ClearButton
          onPress={clearColor}
          title={'Clear Custom Color'}
        />
      </View>
    </ModalWrapper>
  );
};

export default TagColorPickerModal;
