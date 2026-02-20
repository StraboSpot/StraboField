import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';

const SampleDetailOverview = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel, getSurvey} = useForm();

  /* Derived Variables */

  let sampleDetail = JSON.parse(JSON.stringify(spot.properties?.samples?.[0])) || {};
  delete sampleDetail.id;

  const formName = ['general', 'samples'];
  // Order fields to match sample form survey order
  const fieldOrder = getSurvey(formName)
    .filter(field => field.type !== 'start' && field.type !== 'end')
    .map(field => field.name);
  sampleDetail = fieldOrder.reduce((ordered, key) => {
    if (key in sampleDetail) ordered[key] = sampleDetail[key];
    return ordered;
  }, {});

  /* Event Handlers */

  const onIGSNPressed = () => {
    dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));
  };

  const onViewDetailPressed = () => {
    dispatch(setSelectedAttributes([spot.properties?.samples?.[0]] || []));
    dispatch(setNotebookPageVisible(PAGE_KEYS.SAMPLES));
  };

  /* Logic Helpers */

  const getDate = (value) => {
    const dateObject = new Date(value);
    return dateObject.toDateString();
  };

  const getTime = (value) => {
    const dateObject = new Date(value);
    return dateObject.toLocaleTimeString();
  };

  /* View */

  return (
    <View style={{padding: 10, gap: 5, flex: 1, flexDirection: 'column'}}>
      {Object.entries(sampleDetail).slice(0, 10).map(([key, value]) => {
        return (
          <Text key={key} style={[commonStyles.listItemTitle, {paddingVertical: 2}]}>
            <Text style={{fontWeight: 'bold'}}>{getLabel(key, formName)}: </Text>
            {key === 'collection_date' ? getDate(value)
              : key === 'collection_time' ? getTime(value)
                : key === 'sample_description' ? truncateText(value, 300) : getLabel(value, formName)}
          </Text>
        );
      })}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        padding: 10,
      }}>
        <Pressable onPress={onViewDetailPressed}>
          <Text style={[commonStyles.listItemTitle, {color: PRIMARY_ACCENT_COLOR, paddingTop: 5}]}>
            View More Detail
          </Text>
        </Pressable>
        {sampleDetail.Sample_IGSN && <Pressable onPress={onIGSNPressed}>
          <Text style={[commonStyles.listItemTitle, {
            color: PRIMARY_ACCENT_COLOR,
            paddingTop: 5,
          }]}>
            View IGSN Data
          </Text>
        </Pressable>}
      </View>
    </View>
  );
};

export default SampleDetailOverview;
