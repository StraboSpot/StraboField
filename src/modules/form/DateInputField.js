import React, {useEffect, useState} from 'react';
import {Appearance, Platform, Text, View} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import {useField, useFormikContext} from 'formik';
import moment from 'moment';

import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {formStyles} from '../form';

const DateInputField = ({
                          isDisplayOnly,
                          isRequired,
                          isShowTime,
                          isShowTimeOnly,
                          label,
                          name,
                          setFieldValueOverride,  // For a page that does its own work on a change
                        }) => {
  /* Data Hooks */

  const [{value}] = useField(name);
  // Read the errors from the form rather than take useField's meta.error - see TextInputField
  const {errors, setFieldValue} = useFormikContext();

  /* Local State */

  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const [date, setDate] = useState(Date.parse(value) ? new Date(value) : new Date());
  const [isDatePickerModalVisible, setIsDatePickerModalVisible] = useState(false);

  /* Derived Variables */

  const setValue = setFieldValueOverride || setFieldValue;
  let title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a') : isShowTime ? moment(value).format(
    'MM/DD/YYYY, h:mm:ss a') : moment(value).format('MM/DD/YYYY') : undefined;

  /* Side Effects */

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme: newColorScheme}) => {
      setColorScheme(newColorScheme);
    });
    return () => subscription.remove();
  }, [colorScheme]);

  /* Event Handlers */

  const onSavePressed = async () => {
    await saveDate(null, date);
    setIsDatePickerModalVisible(false);
  };

  /* Logic Helpers */

  const changeDate = (event, selectedDate) => {
    Platform.OS === 'ios' ? setDate(selectedDate) : saveDate(event, selectedDate);
  };

  // Whatever is picked is written, even a date range in the wrong order: the survey's own validation catches that
  // one, marking both dates and holding the save. Refusing the write here instead left each platform with a rule
  // of its own - iOS wrote the value before its check could stop it, and Android turned it away with a message
  // modal that never appeared on the page the field is used from.
  const saveDate = async (event, selectedDate) => {
    console.log('Change Date', name, event, selectedDate);
    if (Platform.OS === 'ios') selectedDate = selectedDate.toISOString();
    else {
      setIsDatePickerModalVisible(false);
      if (event.type === 'neutralButtonPressed') selectedDate = undefined;
      else if (event.type === 'set') {
        setDate(selectedDate);
        selectedDate = selectedDate.toISOString();
      }
      // The picker was dismissed without a choice, by tapping outside it
      else return;
    }
    setValue(name, selectedDate);
  };

  /* Render Functions */

  const renderDatePicker = () => {
    return (
      // <View style={{}}>
      <DateTimePicker
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        mode={isShowTimeOnly ? 'time' : 'date'}
        neutralButton={{label: 'Clear', textColor: 'grey'}} // Android only
        onChange={changeDate}
        textColor={colorScheme === 'dark' && 'black'}
        value={date}
      />
      // </View>
    );
  };

  const renderDatePickerDialogBox = () => {
    return (<ModalWrapper
      actionTitle={'Set Date'}
      headerTitle={'Pick ' + label}
      isVisible={isDatePickerModalVisible}
      onActionPressed={onSavePressed}
      overlayStyleOverride={{width: 350, maxHeight: 350}}
      showCancelButton={false}
    >
      {renderDatePicker()}
    </ModalWrapper>);
  };

  /* View */

  return (<>
    {label && (<View style={formStyles.fieldLabelContainer}>
      <Text style={formStyles.fieldLabel}>
        {label}
        {isRequired && <Text style={formStyles.fieldRequired}> *</Text>}
      </Text>
    </View>)}
    {isDisplayOnly ? (<Text style={{...formStyles.fieldValue, paddingTop: 5, paddingBottom: 5}}>
      {title}
    </Text>) : (<Text
      onPress={() => setIsDatePickerModalVisible(true)}
      style={{...formStyles.fieldValue, paddingTop: 5, paddingBottom: 5}}
    >
      {title}
    </Text>)}
    {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    {Platform.OS === 'ios' ? renderDatePickerDialogBox() : isDatePickerModalVisible && renderDatePicker()}
  </>);
};

export default DateInputField;
