import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty, truncateText} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';
import IGSNModal from './igsn/IGSNModal';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import {setInitialSesarState} from '../user/userProfile.slice';

const SampleDetailOverview = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const {sesarToken} = useSelector(state => state.user.sesar);

  const {getLabel, getSurvey} = useForm();
  const toast = useToast();

  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

  /* Derived Variables */

  let sampleDetail = JSON.parse(JSON.stringify(spot.properties?.samples[0])) || {};
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
    sampleDetail?.Sample_IGSN
      ? dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN))
      // : console.log('SESAR LOGIN  MODAL');
      : openIGSNModal();
  };

  const openIGSNModal = () => {
    dispatch(setSelectedAttributes([spot.properties?.samples?.[0]] || []));
    setIsIGSNModalVisible(true);
  };

  const onReset = () => {
    dispatch(setInitialSesarState());
    console.log('Sesar credentials have beed reset');
    toast.show('Sesar credentials have beed reset', {type: 'success'});
    // handleIGSNChecked(false);
  };

  const onViewDetailPressed = () => {
    dispatch(setSelectedAttributes(spot.properties?.samples?.length > 0 ? [spot.properties.samples[0]] : []));
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
        {<Pressable onPress={onIGSNPressed}>
          <Text style={[commonStyles.listItemTitle, {
            color: PRIMARY_ACCENT_COLOR,
            paddingTop: 5,
          }]}>
            View IGSN Data
          </Text>
        </Pressable>}
      </View>
      {!isEmpty(sesarToken?.access) && <ClearButton onPress={onReset} title={'Reset SESAR Credentials'}/>}
      {isIGSNModalVisible && (
        <IGSNModal
          isVisible={isIGSNModalVisible}
          onModalCancel={() => setIsIGSNModalVisible(false)}
          // onSampleSaved={onSampleSaved}
          // ref={formRef}
          // sampleValues={formRef.current?.values}
        />
      )}
    </View>
  );
};

export default SampleDetailOverview;
