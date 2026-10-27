import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {SAMPLE_IGSN_KEY} from './samples.constants';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import useForm from '../form/useForm';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';

const SampleDetailOverview = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const igsnSpotIdsToUpload = useSelector(state => state.project.igsnSpotIdsToUpload);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel, getSurvey} = useForm();

  /* Derived Variables */

  const sampleValues = spot.properties?.samples?.[0];
  const sampleIGSN = sampleValues?.[SAMPLE_IGSN_KEY];
  const isIGSNUpdatePending = !!sampleIGSN && igsnSpotIdsToUpload.includes(spot.properties.id);

  let sampleDetail = JSON.parse(JSON.stringify(sampleValues ?? {}));
  delete sampleDetail.id;
  // A label is filled in with the sample's own name on save, so unless it has been typed over it would repeat
  // the row below it - and only ten rows are shown, so it would cost one of them to say nothing
  if (sampleDetail.label === sampleDetail.sample_id_name) delete sampleDetail.label;

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

  const onViewDetailPressed = () => {
    dispatch(setSelectedAttributes(spot.properties?.samples?.length > 0 ? [spot.properties.samples[0]] : []));
    dispatch(setNotebookPageVisible(PAGE_KEYS.SAMPLES));
  };

  const onViewIGSNPressed = () => dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));

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
        // Saved changes not uploaded yet, so strabospot.org has not updated the IGSN record from them
        if (key === SAMPLE_IGSN_KEY && isIGSNUpdatePending) {
          return (
            <View key={key} style={{alignItems: 'center', flexDirection: 'row', gap: 5}}>
              <Icon color={PRIMARY_ACCENT_COLOR} name={'cloud-upload-outline'} size={20} type={'ionicon'}/>
              <Text style={[commonStyles.listItemTitle, {paddingVertical: 2}]}>
                <Text style={{fontWeight: 'bold'}}>{getLabel(key, formName)}: </Text>
                {value}
              </Text>
            </View>
          );
        }
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
        {!!sampleIGSN && (
          <Pressable onPress={onViewIGSNPressed}>
            <Text style={[commonStyles.listItemTitle, {color: PRIMARY_ACCENT_COLOR, paddingTop: 5}]}>
              View IGSN Data
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default SampleDetailOverview;
