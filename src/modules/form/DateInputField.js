import React, {useEffect, useState} from 'react';
import {Appearance, Platform, Text, View} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import {useDispatch} from 'react-redux';

import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {formStyles} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';

const DateInputField = ({
                          field: {name, value},
                          form: {errors, values},
                          isDisplayOnly,
                          isShowTime,
                          isShowTimeOnly,
                          label,
                          onMyChange,
                          setFieldValue,
                        }) => {
  const [isDatePickerModalVisible, setIsDatePickerModalVisible] = useState(false);
  const [date, setDate] = useState(Date.parse(value) ? new Date(value) : new Date());
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  const dispatch = useDispatch();

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme: newColorScheme}) => {
      setColorScheme(newColorScheme);
    });
    return () => subscription.remove();
  }, [colorScheme]);

  let title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a') : isShowTime ? moment(value).format(
    'MM/DD/YYYY, h:mm:ss a') : moment(value).format('MM/DD/YYYY') : undefined;

  const changeDate = (event, selectedDate) => {
    Platform.OS === 'ios' ? setDate(selectedDate) : saveDate(event, selectedDate);
  };

  const onSavePressed = async () => {
    await saveDate(null, date);
    setIsDatePickerModalVisible(false);
  };

  const saveDate = async (event, selectedDate) => {
    console.log('Change Date', name, event, selectedDate);
    if (Platform.OS === 'ios') {
      selectedDate = selectedDate.toISOString();
      if (onMyChange && typeof onMyChange === 'function') onMyChange(name, selectedDate);
    }
    else {
      setIsDatePickerModalVisible(false);
      if (event.type === 'neutralButtonPressed') selectedDate = undefined; else if (event.type === 'set') {
        setDate(selectedDate);
        selectedDate = selectedDate.toISOString();
      }
      else {
        // User dismissed the picker without selecting (e.g., by tapping outside)
        return;
      }
    }

    // Validate start_date against end_date if both will exist
    if (selectedDate && name === 'start_date' && values.end_date) {
      if (Date.parse(selectedDate) <= Date.parse(values.end_date)) setFieldValue(name, selectedDate); else {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\nStart Date must be before End Date.'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    // Validate end_date against start_date if both will exist
    else if (selectedDate && name === 'end_date' && values.start_date) {
      if (Date.parse(values.start_date) <= Date.parse(selectedDate)) setFieldValue(name, selectedDate); else {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\nStart Date must be before End Date.'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    // No validation needed, just set the value
    else setFieldValue(name, selectedDate);
    console.log('After setFieldValue, name:', name, 'selectedDate:', selectedDate);
  };

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

  return (<>
    {label && (<View style={formStyles.fieldLabelContainer}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
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
