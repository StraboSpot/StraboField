import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {CheckBox, Icon, ListItem} from '@rn-vui/base';
import MultiSelect from 'react-native-multiple-select';

import useColumnLayout from './useColumnLayout';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  WARNING_COLOR,
} from '../../shared/styles.constants';
import {formStyles} from '../form';

const SelectInputField = ({
                            appearance,
                            choices,
                            // Formik's `as` prop passes the field flattened and without the form bag, so unlike
                            // TextInputField and its siblings this can't read form.errors — every caller passes
                            // them in. Defaulted so a caller that forgets shows no error rather than throwing.
                            errors = {},
                            isReadOnly,
                            label,
                            multiSelectStyle,
                            name,
                            onMyChange,
                            onShowFieldInfo,
                            placeholder,
                            setFieldValue,
                            showExpandedChoices,
                            single,
                            value,
                          }) => {
  /* Data Hooks */

  // Only the horizontal layouts render these rows; the other layouts stack the choices or list them in a dropdown
  const {isMeasured, isSpread, onContainerLayout, onItemLayout, rows: choiceRows} = useColumnLayout(choices);

  /* Derived Variables */

  const isCompact = appearance === 'horizontal-compact';
  const isHorizontal = appearance === 'horizontal' || isCompact;
  const placeholderText = name === 'spot_id_for_pet_copy' ? '-- None --' : `-- Select ${label} --`;

  /* Event Handlers */

  const handleChoicePressed = (item) => {
    if (single) fieldValueChanged([item.value]);
    else if (value?.includes(item.value)) fieldValueChanged(value.filter(v => v !== item.value));
    else fieldValueChanged([...value || [], item.value]);
  };

  /* Logic Helpers */

  const fieldValueChanged = (itemValue) => {
    if (single) {
      if (itemValue[0] === value) setFieldValue(name, undefined);
      else if (onMyChange && typeof onMyChange === 'function') onMyChange(name, itemValue[0]);
      else setFieldValue(name, itemValue[0]);
    }
    else setFieldValue(name, isEmpty(itemValue) ? undefined : itemValue);
  };

  // Radio buttons for a single choice field, checkboxes for a multiple choice one
  const getChoiceIconName = (isSelected) => {
    if (single) return isSelected ? 'radiobox-marked' : 'radiobox-blank';
    return isSelected ? 'checkbox-marked' : 'checkbox-blank-outline';
  };

  const getChoiceLabel = (itemValue) => {
    if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length > 1) return 'Multiple Selected';
    else if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length === 1) {
      itemValue = itemValue[0];
    }
    const choiceFound = choices.find(choice => choice.value === itemValue);
    return choiceFound ? choiceFound.label : '';
  };

  const isChoiceSelected = item => single ? value === item.value : !!value?.includes(item.value);

  /* Render Functions */

  const renderChoiceIcon = (isSelected) => {
    return (
      <Icon
        color={isSelected ? PRIMARY_ACCENT_COLOR : DARKGREY}
        name={getChoiceIconName(isSelected)}
        type={'material-community'}
      />
    );
  };

  const renderChoiceItem = (item) => {
    return (
      <ListItem
        containerStyle={commonStyles.listItemFormField}
        disabled={item.disabled}
        key={item.value}
        onPress={() => handleChoicePressed(item)}
      >
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>{item.label}</ListItem.Title>
        </ListItem.Content>
        <ListItem.CheckBox
          checked={isChoiceSelected(item)}
          checkedIcon={renderChoiceIcon(true)}
          disabled={item.disabled}
          onPress={() => handleChoicePressed(item)}
          uncheckedIcon={renderChoiceIcon(false)}
        />
      </ListItem>
    );
  };

  const renderChoiceRow = (row, rowIndex) => {
    return (
      <View
        key={rowIndex}
        style={[formStyles.horizontalChoicesRow, !isMeasured && formStyles.horizontalChoicesUnmeasured,
          isSpread && formStyles.horizontalChoicesSpread]}
      >
        {row.map(({item, width}) => (
          <View key={item.value} onLayout={e => onItemLayout(item, e)} style={{width}}>
            {isCompact ? renderCompactChoiceItem(item) : renderHorizontalChoiceItem(item)}
          </View>
        ))}
      </View>
    );
  };

  const renderChoices = () => {
    // console.log('Field Choices', choices);
    return (
      <>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            {renderFieldLabel()}
          </ListItem.Content>
        </ListItem>
        {renderChoicesList()}
      </>
    );
  };

  const renderChoicesList = () => {
    if (isHorizontal) {
      return (
        <View onLayout={onContainerLayout} style={formStyles.horizontalChoices}>
          {choiceRows.map(renderChoiceRow)}
        </View>
      );
    }
    return choices.map(item => renderChoiceItem(item));
  };

  // Choice label stacked above its radio/checkbox rather than beside it. Held to one line so that a
  // label containing spaces wraps the choices onto another row rather than breaking at its own spaces.
  const renderCompactChoiceItem = (item) => {
    return (
      <TouchableOpacity
        disabled={item.disabled}
        onPress={() => handleChoicePressed(item)}
        style={formStyles.horizontalChoiceCompact}
      >
        <Text numberOfLines={1} style={commonStyles.listItemTitle}>{item.label}</Text>
        {renderChoiceIcon(isChoiceSelected(item))}
      </TouchableOpacity>
    );
  };

  const renderFieldLabel = () => {
    return (
      <View style={formStyles.fieldLabelContainer}>
        <Text style={formStyles.fieldLabel}>{label}</Text>
        {placeholder && (
          <Icon
            color={PRIMARY_ACCENT_COLOR}
            name={'information-circle-outline'}
            onPress={() => onShowFieldInfo(label, placeholder)}
            type={'ionicon'}
          />
        )}
      </View>
    );
  };

  // Choice label beside its radio/checkbox
  const renderHorizontalChoiceItem = (item) => {
    return (
      <CheckBox
        checked={isChoiceSelected(item)}
        checkedIcon={renderChoiceIcon(true)}
        containerStyle={formStyles.horizontalChoiceContainer}
        disabled={item.disabled}
        onPress={() => handleChoicePressed(item)}
        textStyle={[commonStyles.listItemTitle, formStyles.horizontalChoiceTitle]}
        title={item.label}
        uncheckedIcon={renderChoiceIcon(false)}
      />
    );
  };

  // Choices in a wrapping row instead of a dropdown, for fields with an appearance of horizontal
  const renderHorizontalChoices = () => {
    return (
      <>
        {renderFieldLabel()}
        {renderChoicesList()}
        {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      </>
    );
  };

  const renderInput = () => {
    if (showExpandedChoices) return renderChoices();
    else if (isHorizontal) return renderHorizontalChoices();
    return renderMultiSelect();
  };

  const renderMultiSelect = () => {
    return (
      <>
        {renderFieldLabel()}
        <View style={[formStyles.fieldValue, {paddingBottom: 0}, multiSelectStyle]}>
          <MultiSelect
            displayKey={'label'}
            fontSize={PRIMARY_TEXT_SIZE}
            hideDropdown={true}
            hideSubmitButton={true}
            hideTags={false}
            itemTextColor={PRIMARY_TEXT_COLOR}
            items={choices}
            onSelectedItemsChange={fieldValueChanged}
            searchIcon={false}
            searchInputPlaceholderText={isEmpty(value) ? placeholderText : getChoiceLabel(value)}
            selectText={isEmpty(value) ? placeholderText : getChoiceLabel(value)}
            selectedItemIconColor={PRIMARY_TEXT_COLOR}
            selectedItemTextColor={PRIMARY_TEXT_COLOR}
            selectedItems={isEmpty(value) || typeof value === 'object' ? value : [value]}
            single={single}
            styleDropdownMenu={formStyles.dropdownContainer}
            styleDropdownMenuSubsection={formStyles.dropdownSelectedContainer}
            styleIndicator={formStyles.dropdownIndicator}
            styleInputGroup={formStyles.dropdownInputGroup}
            styleItemsContainer={formStyles.dropdownItemsContainer}
            tagBorderColor={PRIMARY_TEXT_COLOR}
            tagContainerStyle={formStyles.dropdownTagContainer}
            tagRemoveIconColor={isReadOnly ? SECONDARY_BACKGROUND_COLOR : WARNING_COLOR}
            tagTextColor={PRIMARY_TEXT_COLOR}
            textColor={PRIMARY_TEXT_COLOR}
            textInputProps={{editable: false}}
            uniqueKey={'value'}
          />
        </View>
        {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      </>
    );
  };

  /* View */

  return renderInput();
};

export default SelectInputField;
