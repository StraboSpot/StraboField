import React from 'react';
import {Pressable, Text} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';
import {setSelectedAttributes} from '../spots/spots.slice';

const SampleDetailOverview = ({page}) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel, getSurvey} = useForm();

  const formName = ['general', 'samples'];
  let sampleDetail = JSON.parse(JSON.stringify(spot.properties?.samples?.[0])) || {};
  delete sampleDetail.id;

  // Order fields to match sample form survey order
  const fieldOrder = getSurvey(formName)
    .filter(field => field.type !== 'start' && field.type !== 'end')
    .map(field => field.name);
  sampleDetail = fieldOrder.reduce((ordered, key) => {
    if (key in sampleDetail) ordered[key] = sampleDetail[key];
    return ordered;
  }, {});

  const getDate = (value) => {
    const dateObject = new Date(value);
    return dateObject.toDateString();
  };

  const getTime = (value) => {
    const dateObject = new Date(value);
    return dateObject.toLocaleTimeString();
  };

  const onPressed = (item) => {
    dispatch(setSelectedAttributes([spot.properties?.samples?.[0]] || []));
    dispatch(setNotebookPageVisible(PAGE_KEYS.SAMPLES));
  };

  return (
    <Pressable onPress={onPressed} style={{padding: 10}}>
      {Object.entries(sampleDetail).slice(0, 10).map(([key, value]) => {
        return (
          <Text key={key} style={[commonStyles.listItemTitle, {paddingVertical: 2}]}>
            <Text style={{fontWeight: 'bold'}}>{getLabel(key, formName)}: </Text>
            {key === 'collection_date' ? getDate(value)
              : key === 'collection_time' ? getTime(value)
                : getLabel(value, formName)}
          </Text>
        );
      })}
      <Text style={[commonStyles.listItemTitle, {color: PRIMARY_ACCENT_COLOR, paddingTop: 5}]}>View More Detail</Text>
    </Pressable>
  );
};

export default SampleDetailOverview;
