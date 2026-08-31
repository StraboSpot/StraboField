import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {CheckBox, Icon, ListItem} from '@rn-vui/base';
import {useField, useFormikContext} from 'formik';
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
                            dropdownStyle,
                            isReadOnly,
                            isRequired,
                            isSingleSelect,
                            label,
                            name,
                            onShowFieldInfo,
                            onValueChanged,         // Runs after the write, not instead of it
                            placeholder,
                            setFieldValueOverride,  // For a page that does its own work on a change
                            shouldShowChoiceList,   // Lay the choices out rather than collapse them into a dropdown
                          }) => {
  /* Data Hooks */

  const [{value}] = useField(name);
  // Read the errors from the form rather than take useField's meta.error - see TextInputField
  const {errors, setFieldValue} = useFormikContext();
  // Only the in-rows layout uses these; the others stack the choices or collapse them into the dropdown
  const {isMeasured, isSpread, onContainerLayout, onItemLayout, rows: choiceRows} = useColumnLayout(choices);

  /* Derived Variables */

  const setValue = setFieldValueOverride || setFieldValue;
  const isChoiceLabelStacked = appearance === 'horizontal-compact';
  const isChoiceListInRows = appearance === 'horizontal' || isChoiceLabelStacked;
  // A horizontal appearance lays the choices out too, so the dropdown is what is left when neither asks for them
  const isChoiceListShown = shouldShowChoiceList || isChoiceListInRows;
  const placeholderText = name === 'spot_id_for_pet_copy' ? '-- None --' : `-- Select ${label} --`;
  const selectedValues = isEmpty(value) ? [] : Array.isArray(value) ? value : [value];
  // A saved value these choices don't contain still counts toward the field but renders no row to untick and no
  // tag to remove, so there is no way to clear it. It happens where two forms edit the same field from lists
  // that have drifted apart, and to anything written against an older version of a list. Give it a row of its
  // own, labeled the way useForm labels an unknown key; deselecting it takes the row away with it
  const unlistedChoices = selectedValues.filter(v => !choices.some(choice => choice.value === v)).map(v => ({
    disabled: choices[0]?.disabled ?? isReadOnly,
    label: String(v).replace(/_/g, ' '),
    value: v,
  }));
  const allChoices = isEmpty(unlistedChoices) ? choices : [...choices, ...unlistedChoices];

  /* Event Handlers */

  const handleChoicePressed = (item) => {
    if (isSingleSelect) fieldValueChanged([item.value]);
    else if (value?.includes(item.value)) fieldValueChanged(value.filter(v => v !== item.value));
    else fieldValueChanged([...value || [], item.value]);
  };

  /* Logic Helpers */

  // Choosing the value a single-select field already holds deselects it
  const fieldValueChanged = (itemValue) => {
    const newValue = isSingleSelect ? itemValue[0] === value ? undefined : itemValue[0]
      : isEmpty(itemValue) ? undefined : itemValue;
    setValue(name, newValue);
    onValueChanged && onValueChanged(name, newValue);
  };

  // Radio buttons for a single-select field, checkboxes for a multi-select one
  const getChoiceIconName = (isSelected) => {
    if (isSingleSelect) return isSelected ? 'radiobox-marked' : 'radiobox-blank';
    return isSelected ? 'checkbox-marked' : 'checkbox-blank-outline';
  };

  const getChoiceLabel = (itemValue) => {
    if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length > 1) return 'Multiple Selected';
    else if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length === 1) {
      itemValue = itemValue[0];
    }
    const choiceFound = allChoices.find(choice => choice.value === itemValue);
    return choiceFound ? choiceFound.label : '';
  };

  const isChoiceSelected = item => isSingleSelect ? value === item.value : !!value?.includes(item.value);

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
            {isChoiceLabelStacked ? renderCompactChoiceItem(item) : renderHorizontalChoiceItem(item)}
          </View>
        ))}
      </View>
    );
  };

  const renderChoicesList = () => {
    if (isChoiceListInRows) {
      return (
        <View onLayout={onContainerLayout} style={formStyles.horizontalChoices}>
          {choiceRows.map(renderChoiceRow)}
          {!isEmpty(unlistedChoices) && renderUnlistedRow()}
        </View>
      );
    }
    return allChoices.map(item => renderChoiceItem(item));
  };

  // The field label gets a row of its own above the choices
  const renderChoicesWithLabelRow = () => {
    // console.log('Field Choices', choices);
    return (
      <>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            {renderFieldLabel()}
          </ListItem.Content>
        </ListItem>
        {renderChoicesList()}
        {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      </>
    );
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
        <Text style={formStyles.fieldLabel}>
          {label}
          {isRequired && <Text style={formStyles.fieldRequired}> *</Text>}
        </Text>
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

  // The field label sits directly above the choices, for a horizontal or horizontal-compact appearance
  const renderHorizontalChoices = () => {
    return (
      <>
        {renderFieldLabel()}
        {renderChoicesList()}
        {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      </>
    );
  };

  // The two laid-out renderings differ in the field label alone: one gives it a row of its own
  const renderInput = () => {
    if (!isChoiceListShown) return renderMultiSelect();
    return shouldShowChoiceList ? renderChoicesWithLabelRow() : renderHorizontalChoices();
  };

  const renderMultiSelect = () => {
    return (
      <>
        {renderFieldLabel()}
        <View style={[formStyles.fieldValue, {paddingBottom: 0}, dropdownStyle]}>
          <MultiSelect
            displayKey={'label'}
            fontSize={PRIMARY_TEXT_SIZE}
            hideDropdown={true}
            hideSubmitButton={true}
            hideTags={false}
            itemTextColor={PRIMARY_TEXT_COLOR}
            items={allChoices}
            onSelectedItemsChange={fieldValueChanged}
            searchIcon={false}
            searchInputPlaceholderText={isEmpty(value) ? placeholderText : getChoiceLabel(value)}
            selectText={isEmpty(value) ? placeholderText : getChoiceLabel(value)}
            selectedItemIconColor={PRIMARY_TEXT_COLOR}
            selectedItemTextColor={PRIMARY_TEXT_COLOR}
            selectedItems={isEmpty(value) || typeof value === 'object' ? value : [value]}
            single={isSingleSelect}
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

  // Kept out of the measured columns above, which are laid out from the choices the field offers. These are
  // not among them, so they sit in a row of their own below
  const renderUnlistedRow = () => {
    return (
      <View style={formStyles.horizontalChoicesRow}>
        {unlistedChoices.map(item => (
          <View key={item.value}>
            {isChoiceLabelStacked ? renderCompactChoiceItem(item) : renderHorizontalChoiceItem(item)}
          </View>
        ))}
      </View>
    );
  };

  /* View */

  return renderInput();
};

export default SelectInputField;
