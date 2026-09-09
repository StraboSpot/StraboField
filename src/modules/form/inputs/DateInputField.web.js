import React, {useState} from 'react';
import {Text} from 'react-native';

import {useField, useFormikContext} from 'formik';
import moment from 'moment';
import {DatePicker} from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import FieldLabel from './FieldLabel';
import formStyles from '../form.styles';

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

  const [date, setDate] = useState(Date.parse(value) ? new Date(value) : undefined);

  /* Derived Variables */

  const setValue = setFieldValueOverride || setFieldValue;
  const title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a')
      : isShowTime ? moment(value).format('MM/DD/YYYY, h:mm:ss a')
        : moment(value).format('MM/DD/YYYY')
    : undefined;

  /* Logic Helpers */

  // Whatever is picked is written, even a date range in the wrong order: the survey's own validation catches that
  // one, marking both dates and holding the save, the same as on a device
  const changeDate = (selectedDate) => {
    console.log('Change Date', name, selectedDate);
    setDate(selectedDate);
    selectedDate = selectedDate?.toISOString();
    setValue(name, selectedDate);
  };

  /* Render Functions */

  const renderDatePickerWeb = () => {
    if (isShowTimeOnly) {
      return (
        <DatePicker
          dateFormat={'h:mm aa'}
          onChange={changeDate}
          portalId={'root-portal'}
          selected={date}
          showIcon
          showTimeSelect
          showTimeSelectOnly
          timeCaption={'Time'}
          timeIntervals={15}
        />
      );
    }
    else {
      return (
        <DatePicker
          onChange={changeDate}
          portalId={'root-portal'}
          selected={date}
          showIcon
        />
      );
    }
  };

  /* View */

  return (
    <>
      {label && <FieldLabel isRequired={isRequired} label={label}/>}
      {isDisplayOnly ? <Text style={formStyles.fieldValue}>{title}</Text>
        : renderDatePickerWeb()}
      {errors[name] && <Text style={formStyles.fieldError}>{errors[name]}</Text>}
    </>
  );
};

export default DateInputField;
