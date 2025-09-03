import React, {useEffect, useState} from 'react';
import {Appearance, Platform, Text, View} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import {Button} from '@rn-vui/base';
import moment from 'moment';
import {useDispatch} from 'react-redux';

import DateDialogBox from '../../shared/ui/StatusDialogBox';
import {formStyles} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';

const DateInputField = ({
                          field: {name, onBlur, onChange, value},
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
    const subscription = Appearance.addChangeListener(
      ({colorScheme: newColorScheme}) => {
        setColorScheme(newColorScheme);
      },
    );
    return () => subscription.remove();
  }, [colorScheme]);

  let title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a')
      : isShowTime ? moment(value).format('MM/DD/YYYY, h:mm:ss a')
        : moment(value).format('MM/DD/YYYY')
    : undefined;

  const changeDate = (event, selectedDate) => {
    Platform.OS === 'ios' ? setDate(selectedDate) : saveDate(event, selectedDate);
  };

  const saveDate = (event, selectedDate) => {
    // console.log('Change Date', name, event, selectedDate);
    if (Platform.OS === 'ios') {
      selectedDate = selectedDate.toISOString();
      if (onMyChange && typeof onMyChange === 'function') onMyChange(name, selectedDate);
    }
    else {
      setIsDatePickerModalVisible(false);
      if (event.type === 'neutralButtonPressed') selectedDate = undefined;
      else if (event.type === 'set') {
        setDate(selectedDate);
        selectedDate = selectedDate.toISOString();
      }
    }
    if (selectedDate && name === 'start_date' && values.end_date) {
      if (Date.parse(selectedDate) <= Date.parse(values.end_date)) setFieldValue(name, selectedDate);
      else {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\nStart Date must be before End Date.'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    else if (selectedDate && name === 'end_date' && values.start_date) {
      if (Date.parse(values.start_date) <= Date.parse(selectedDate)) setFieldValue(name, selectedDate);
      else {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\nStart Date must be before End Date.'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    else setFieldValue(name, selectedDate);
  };

  const renderDatePicker = () => {
    return (
      <View style={{width: '100%'}}>
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          mode={isShowTimeOnly ? 'time' : 'date'}
          neutralButton={{label: 'Clear', textColor: 'grey'}} // Android only
          onChange={changeDate}
          textColor={colorScheme === 'dark' && 'black'}
          value={date}
        />
      </View>
    );
  };

  const renderDatePickerDialogBox = () => {
    return (
      <DateDialogBox
        isVisible={isDatePickerModalVisible}
        onTouchOutside={() => setIsDatePickerModalVisible(false)}
        title={'Pick ' + label}
      >
        {renderDatePicker()}
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-evenly'}}>
          <Button
            onPress={() => {
              setFieldValue(name, undefined);
              setIsDatePickerModalVisible(false);
            }}
            title={'Clear'}
            type={'clear'}
          />
          <Button
            onPress={() => {
              saveDate(null, date);
              setIsDatePickerModalVisible(false);
            }}
            title={'Close'}
            type={'clear'}
          />
        </View>
      </DateDialogBox>
    );
  };

  return (
    <>
      {label && (
        <View style={formStyles.fieldLabelContainer}>
          <Text style={formStyles.fieldLabel}>{label}</Text>
        </View>
      )}
      {isDisplayOnly ? (
          <Text style={{...formStyles.fieldValue, paddingTop: 5, paddingBottom: 5}}>
            {title}
          </Text>
        )
        : (
          <Text
            onPress={() => setIsDatePickerModalVisible(true)}
            style={{...formStyles.fieldValue, paddingTop: 5, paddingBottom: 5}}
          >
            {title}
          </Text>
        )}
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
      {Platform.OS === 'ios' ? renderDatePickerDialogBox() : isDatePickerModalVisible && renderDatePicker()}
    </>
  );
};

export default DateInputField;
