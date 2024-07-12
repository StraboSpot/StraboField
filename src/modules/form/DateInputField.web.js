import React, {useState} from 'react';
import {Text, View} from 'react-native';

import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {useDispatch} from 'react-redux';

import {formStyles} from '../form';
import {addedStatusMessage, clearedStatusMessages, setIsErrorMessagesModalVisible} from '../home/home.slice';

const DateInputField = ({
                          field: {name, onBlur, onChange, value},
                          form: {errors, touched, setFieldValue, values},
                          isDisplayOnly,
                          isShowTime,
                          isShowTimeOnly,
                          label,
                        }) => {
  const [date, setDate] = useState(Date.parse(value) ? new Date(value) : undefined);

  const dispatch = useDispatch();

  let title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a')
      : isShowTime ? moment(value).format('MM/DD/YYYY, h:mm:ss a')
        : moment(value).format('MM/DD/YYYY')
    : undefined;

  const changeDate = (selectedDate) => {
    console.log('Change Date', name, selectedDate);
    setDate(selectedDate);
    selectedDate = selectedDate?.toISOString();

    if (selectedDate && name === 'start_date' && values.end_date) {
      if (Date.parse(selectedDate) <= Date.parse(values.end_date)) setFieldValue(name, selectedDate);
      else {
        console.log('Date Error!', 'Start Date must be before End Date.');
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\n\nStart Date must be before End Date!'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    else if (selectedDate && name === 'end_date' && values.start_date) {
      if (Date.parse(values.start_date) <= Date.parse(selectedDate)) setFieldValue(name, selectedDate);
      else {
        console.log('Date Error!', 'Start Date must be before End Date.');
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('Date Error!\n\nStart Date must be before End Date!'));
        dispatch(setIsErrorMessagesModalVisible(true));
      }
    }
    else setFieldValue(name, selectedDate);
  };

  const renderDatePickerWeb = () => {
    if (isShowTimeOnly) {
      return (
        <DatePicker
          showIcon
          selected={date}
          onChange={changeDate}
          portalId={'root-portal'}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          timeCaption={'Time'}
          dateFormat={'h:mm aa'}
        />
      );
    }
    else {
      return (
        <DatePicker
          showIcon
          selected={date}
          onChange={changeDate}
          portalId={'root-portal'}
        />
      );
    }
  };

  return (
    <>
      {label && (
        <View style={formStyles.fieldLabelContainer}>
          <Text style={formStyles.fieldLabel}>{label}</Text>
        </View>
      )}
      {isDisplayOnly ? <Text style={{...formStyles.fieldValue, paddingTop: 5, paddingBottom: 5}}>{title}</Text>
        : renderDatePickerWeb()}
    </>
  );
};

export default DateInputField;
