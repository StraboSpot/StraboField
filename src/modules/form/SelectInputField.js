import React, {useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {CheckBox, Icon, ListItem} from '@rn-vui/base';
import MultiSelect from 'react-native-multiple-select';

import {getFittingColumnWidths, getRowsOfColumns, getStretchedColumnWidths} from './columns.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {
  DARKGREY,
  PRIMARY_ACCENT_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SECONDARY_BACKGROUND_COLOR,
  SMALL_SCREEN_WIDTH,
  WARNING_COLOR,
} from '../../shared/styles.constants';
import {formStyles} from '../form';

const SelectInputField = ({
                            appearance,
                            choices,
                            errors,
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
  /* Local State */

  const [choiceWidths, setChoiceWidths] = useState({});
  const [choicesWidth, setChoicesWidth] = useState(0);

  /* Derived Variables */

  const isCompact = appearance === 'horizontal-compact';
  const isHorizontal = appearance === 'horizontal' || isCompact;
  const placeholderText = name === 'spot_id_for_pet_copy' ? '-- None --' : `-- Select ${label} --`;

  // Horizontal choices that fit on a single row keep their natural width and are spread across it. Choices
  // that need more than one row go into columns, sized to the widest choice in each, so the rows line up.
  // Either way they only fill the container if it's narrow enough that filling it doesn't stretch them out.
  const measuredWidths = choices.map(choice => choiceWidths[choice.value]);
  const isMeasured = measuredWidths.every(width => width !== undefined);
  const fittedWidths = isMeasured ? getFittingColumnWidths(measuredWidths, choicesWidth) : [];
  const isFittingOneRow = fittedWidths.length === choices.length;
  const isNarrowContainer = choicesWidth < SMALL_SCREEN_WIDTH;
  const isSpread = isFittingOneRow && isNarrowContainer;
  const columnWidths = isFittingOneRow || !isNarrowContainer ? fittedWidths
    : getStretchedColumnWidths(fittedWidths, choicesWidth);
  // Lay the rows out rather than letting them wrap, so they break where the columns say they do
  const choiceRows = isMeasured ? getRowsOfColumns(choices, columnWidths.length) : [choices];

  /* Event Handlers */

  // Measure each choice once, while it's still at its natural width, before any column width is applied
  const handleChoiceLayout = (item, e) => {
    const {width} = e.nativeEvent.layout;
    if (!isMeasured) setChoiceWidths(prevWidths => ({...prevWidths, [item.value]: width}));
  };

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

  const getChoiceLabel = (itemValue) => {
    if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length > 1) return 'Multiple Selected';
    else if (typeof itemValue === 'object' && Array.isArray(itemValue) && itemValue.length === 1) {
      itemValue = itemValue[0];
    }
    const choiceFound = choices.find(choice => choice.value === itemValue);
    return choiceFound ? choiceFound.label : '';
  };

  /* Render Functions */

  const renderChoiceItem = (item) => {
    const checkboxSelected = (
      <Icon color={PRIMARY_ACCENT_COLOR} name={'checkbox-marked'} type={'material-community'}/>
    );
    const checkboxUnselected = (
      <Icon color={DARKGREY} name={'checkbox-blank-outline'} type={'material-community'}/>
    );
    const radioSelected = (
      <Icon color={PRIMARY_ACCENT_COLOR} name={'radiobox-marked'} type={'material-community'}/>
    );
    const radioUnselected = <Icon color={DARKGREY} name={'radiobox-blank'} type={'material-community'}/>;
    return (
      <React.Fragment key={item.value}>
        {isHorizontal ? (
          <CheckBox
            checked={single ? value === item.value : !!value?.includes(item.value)}
            checkedIcon={single ? radioSelected : checkboxSelected}
            containerStyle={formStyles.horizontalChoiceContainer}
            disabled={item.disabled}
            onPress={() => handleChoicePressed(item)}
            textStyle={[commonStyles.listItemTitle, formStyles.horizontalChoiceTitle]}
            title={item.label}
            uncheckedIcon={single ? radioUnselected : checkboxUnselected}
          />
        ) : (
          <ListItem
            containerStyle={commonStyles.listItemFormField}
            disabled={item.disabled}
            onPress={() => handleChoicePressed(item)}
          >
            <ListItem.Content>
              <ListItem.Title style={commonStyles.listItemTitle}>{item.label}</ListItem.Title>
            </ListItem.Content>
            <ListItem.CheckBox
              checked={single ? value === item.value : !!value?.includes(item.value)}
              checkedIcon={single ? radioSelected : checkboxSelected}
              disabled={item.disabled}
              onPress={() => handleChoicePressed(item)}
              uncheckedIcon={single ? radioUnselected : checkboxUnselected}
            />
          </ListItem>
        )}
      </React.Fragment>
    );
  };

  const renderChoiceRow = (row, rowIndex) => {
    return (
      <View
        key={rowIndex}
        style={[formStyles.horizontalChoicesRow, !isMeasured && formStyles.horizontalChoicesUnmeasured,
          isSpread && formStyles.horizontalChoicesSpread]}
      >
        {row.map((item, columnIndex) => (
          <View
            key={item.value}
            onLayout={e => handleChoiceLayout(item, e)}
            style={{width: isFittingOneRow ? undefined : columnWidths[columnIndex]}}
          >
            {isCompact ? renderCompactChoiceItem(item) : renderChoiceItem(item)}
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
        <View onLayout={e => setChoicesWidth(e.nativeEvent.layout.width)} style={formStyles.horizontalChoices}>
          {choiceRows.map(renderChoiceRow)}
        </View>
      );
    }
    return choices.map(item => renderChoiceItem(item));
  };

  // Choice label stacked above its radio/checkbox rather than beside it
  const renderCompactChoiceItem = (item) => {
    const isChecked = single ? value === item.value : !!value?.includes(item.value);
    const iconName = single ? (isChecked ? 'radiobox-marked' : 'radiobox-blank')
      : (isChecked ? 'checkbox-marked' : 'checkbox-blank-outline');
    return (
      <TouchableOpacity
        disabled={item.disabled}
        onPress={() => handleChoicePressed(item)}
        style={formStyles.horizontalChoiceCompact}
      >
        <Text style={commonStyles.listItemTitle}>{item.label}</Text>
        <Icon
          color={isChecked ? PRIMARY_ACCENT_COLOR : DARKGREY}
          name={iconName}
          type={'material-community'}
        />
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

  // Choices in a wrapping row instead of a dropdown, for fields with an appearance of horizontal
  const renderHorizontalChoices = () => {
    return (
      <>
        {renderFieldLabel()}
        {renderChoicesList()}
        {errors && errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
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
        {errors && errors[name]
          && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      </>
    );
  };

  /* View */

  return renderInput();
};

export default SelectInputField;
