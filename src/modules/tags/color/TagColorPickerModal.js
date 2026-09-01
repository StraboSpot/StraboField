import React, {useRef, useState} from 'react';
import {Pressable, View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import {COLOR_CHOICES} from './tagColor.constants';
import {getRGBString, isValidHexColor, rgbToHex} from './tagColor.helpers';
import commonStyles from '../../../shared/common.styles';
import {isEmpty} from '../../../shared/helpers';
import {BLACK, WHITE} from '../../../shared/styles.constants';
import ActionButton from '../../../shared/ui/buttons/ActionButton';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../../shared/ui/modals/overlay.styles';
import Spacer from '../../../shared/ui/Spacer';
import {FormikWrapper, TextInputField} from '../../form';

const TagColorPickerModal = ({closeModal, onColorSelect, tempColor}) => {
  /* Local State */

  const formRef = useRef(null);

  const [hexColor, setHexColor] = useState(tempColor || undefined);
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Event Handlers */

  const setFieldValueAndMatchingNotation = (field, value) => {
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

  const validateColor = (values) => {
    const errors = {};
    // The two fields are one color written two ways, and each is filled in from the other as either is typed in, so
    // one of them left empty against a filled other is the one the color could not be read from
    if (isEmpty(values.hex) && isEmpty(values.rgb)) errors.hex = 'A color must be picked or typed in';
    else if (isEmpty(values.hex)) errors.rgb = 'Not a color, which is written as 255, 0, 0';
    else if (isEmpty(values.rgb)) errors.hex = 'Not a color, which is written as #FF0000';
    return errors;
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
                    onPress={() => setFieldValueAndMatchingNotation('hex', colorChoice)}
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
        <FormikWrapper
          initialValues={{hex: hexColor, rgb: getRGBString(hexColor)}}
          innerRef={formRef}
          setIsFormInvalid={setIsFormInvalid}
          validate={validateColor}
        >
          <View>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <TextInputField
                  isRequired={true}
                  label={'Hex'}
                  name={'hex'}
                  setFieldValueOverride={setFieldValueAndMatchingNotation}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <TextInputField
                  isRequired={true}
                  label={'RGB'}
                  name={'rgb'}
                  setFieldValueOverride={setFieldValueAndMatchingNotation}
                />
              </ListItem.Content>
            </ListItem>
          </View>
        </FormikWrapper>
        <Spacer/>
        <ActionButton
          disabled={isFormInvalid}
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
