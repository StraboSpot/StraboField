import React, {useRef, useState} from 'react';
import {Pressable, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useSelector} from 'react-redux';

import {getRGBString, isValidHexColor, rgbToHex} from './colorPicker.helpers';
import {useTags} from './index';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {BLACK, WHITE} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';
import Spacer from '../../shared/ui/Spacer';
import {TextInputField} from '../form';

const COLOR_CHOICES = [
  ['#330000', '#331900', '#333300', '#193300', '#003300', '#003319', '#003333', '#001933', '#000033', '#190033', '#330033', '#330019', '#000000'],
  ['#660000', '#663300', '#666600', '#336600', '#006600', '#006633', '#006666', '#003366', '#000066', '#330066', '#660066', '#660033', '#202020'],
  ['#990000', '#994C00', '#999900', '#4C9900', '#009900', '#00994C', '#009999', '#004C99', '#000099', '#4C0099', '#990099', '#99004C', '#404040'],
  ['#CC0000', '#CC6600', '#CCCC00', '#66CC00', '#00CC00', '#00CC66', '#00CCCC', '#0066CC', '#0000CC', '#6600CC', '#CC00CC', '#CC0066', '#606060'],
  ['#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00', '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#7F00FF', '#FF00FF', '#FF007F', '#808080'],
  ['#FF3333', '#FF9933', '#FFFF33', '#99FF33', '#33FF33', '#33FF99', '#33FFFF', '#3399FF', '#3333FF', '#9933FF', '#FF33FF', '#FF3399', '#A0A0A0'],
  ['#FF6666', '#FFB266', '#FFFF66', '#B2FF66', '#66FF66', '#66FFB2', '#66FFFF', '#66B2FF', '#6666FF', '#B266FF', '#FF66FF', '#FF66B2', '#C0C0C0'],
  ['#FF9999', '#FFCC99', '#FFFF99', '#CCFF99', '#99FF99', '#99FFCC', '#99FFFF', '#99CCFF', '#9999FF', '#CC99FF', '#FF99FF', '#FF99CC', '#E0E0E0'],
  ['#FFCCCC', '#FFE5CC', '#FFFFCC', '#E5FFCC', '#CCFFCC', '#CCFFE5', '#CCFFFF', '#CCE5FF', '#CCCCFF', '#E5CCFF', '#FFCCFF', '#FFCCE5', '#FFFFFF'],
];

const ColorPickerModal = ({closeModal}) => {
  /* Data Hooks */

  const selectedTag = useSelector(state => state.project.selectedTag);

  const {saveTag} = useTags();

  /* Local State */

  const formRef = useRef(null);

  const [hexColor, setHexColor] = useState(selectedTag.color || undefined);

  /* Event Handlers */

  const handleColorChanged = (field, value) => {
    if (field === 'rgb') {
      formRef.current.setFieldValue('rgb', value);
      const [r, g, b] = value.replaceAll(' ', '').split(',');
      const hexToTest = rgbToHex(parseInt(r), parseInt(g), parseInt(b));
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
    let selectedTagCopy = JSON.parse(JSON.stringify(selectedTag));
    if (selectedTagCopy.color) delete selectedTagCopy.color;
    saveTag(selectedTagCopy);
    closeModal();
  };

  const setColor = () => {
    saveTag({...selectedTag, color: hexColor});
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
          onPress={setColor}
          title={'Set Color'}
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

export default ColorPickerModal;
