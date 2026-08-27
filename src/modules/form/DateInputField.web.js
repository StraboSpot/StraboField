import React, {useState} from 'react';
import {Text, View} from 'react-native';

import moment from 'moment';
import {DatePicker} from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {formStyles} from '../form';

const DateInputField = ({
                          field: {name, value},
                          isDisplayOnly,
                          isShowTime,
                          isShowTimeOnly,
                          label,
                          onMyChange,
                          setFieldValue,
                        }) => {
  /* Local State */

  const [date, setDate] = useState(Date.parse(value) ? new Date(value) : undefined);

  /* Derived Variables */

  let title = value ? isShowTimeOnly ? moment(value).format('h:mm:ss a')
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
    if (onMyChange && typeof onMyChange === 'function') onMyChange(name, selectedDate);
    else setFieldValue(name, selectedDate);
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
