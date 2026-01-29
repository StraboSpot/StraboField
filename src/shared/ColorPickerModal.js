import React, {useRef, useState} from 'react';
import {Pressable, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useSelector} from 'react-redux';

import commonStyles from './common.styles';
import {isEmpty} from './Helpers';
import {BLACK, WHITE} from './styles.constants';
import {TextInputField} from '../modules/form';
import ActionButton from './ui/buttons/ActionButton';
import overlayStyles from './ui/modals/overlay.styles';
import Spacer from './ui/Spacer';
import {useTags} from '../modules/tags';
import ClearButton from './ui/buttons/ClearButton';
import ModalWrapper from './ui/modals/ModalWrapper';


const ColorPickerModal = ({closeModal}) => {

  const selectedTag = useSelector(state => state.project.selectedTag);

  const [hexColor, setHexColor] = useState(selectedTag.color || undefined);

  const {saveTag} = useTags();

  const formRef = useRef(null);

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

  const clearColor = () => {
    let selectedTagCopy = JSON.parse(JSON.stringify(selectedTag));
    if (selectedTagCopy.color) delete selectedTagCopy.color;
    saveTag(selectedTagCopy);
    closeModal();
  };

  const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };

  const getRGBString = (hex) => {
    if (hex) {
      const {r, g, b} = hexToRgb(hex);
      return `${r}, ${g}, ${b}`;
    }
  };

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

  const hexToRgb = (hex) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16), // Convert the red component to an integer
      g: parseInt(result[2], 16), // Convert the green component to an integer
      b: parseInt(result[3], 16),  // Convert the blue component to an integer
    } : null;
  };

  const isValidHexColor = (str) => {
    // Regex explanation:
    // ^      -> Start of the string
    // #?     -> Optional '#' symbol
    // (      -> Start of a capturing group
    // [0-9a-fA-F]{6} -> Match exactly 6 hex characters
    // |      -> OR
    // [0-9a-fA-F]{3} -> Match exactly 3 hex characters
    // )      -> End of the capturing group
    // $      -> End of the string
    // /i     -> Case-insensitive flag

    const hexRegex = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
    return hexRegex.test(str);
  };

  const rgbToHex = (r, g, b) => {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };

  const setColor = () => {
    saveTag({...selectedTag, color: hexColor});
    closeModal();
  };

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
