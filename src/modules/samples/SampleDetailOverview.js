import React, {useState} from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import IGSNModal from './igsn/IGSNModal';
import LinkSampleModal from './LinkSampleModal';
import SampleActionButton from './SampleActionButton';
import sampleStyles from './samples.styles';
import useLinkSampleAction from './useLinkSampleAction';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/helpers';
import useForm from '../form/useForm';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedAttributes} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';

const SampleDetailOverview = ({openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel, getSurvey} = useForm();
  const {closeLinkSampleModal, isLinkSampleModalVisible, isLinked, linkOrUnlinkSample} = useLinkSampleAction();
  const {isSpotReadOnly} = useSpots();

  /* Local State */

  const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

  /* Derived Variables */

  const sampleValues = spot.properties?.samples?.[0];
  const sampleIGSN = sampleValues?.Sample_IGSN;
  const isReadOnly = isSpotReadOnly(spot);

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

  const onViewIGSNPressed = () => {
    if (sampleIGSN) dispatch(setNotebookPageVisible(PAGE_KEYS.IGSN));
    else setIsIGSNModalVisible(true);
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
      <View style={sampleStyles.actionButtonsContainer}>
        <SampleActionButton
          accessibilityHint={'Opens the full sample record'}
          iconName={'document-text-outline'}
          onPress={onViewDetailPressed}
          title={'Details'}
        />
        <SampleActionButton
          accessibilityHint={sampleIGSN ? 'Shows the sample\'s IGSN record' : 'Registers the sample for an IGSN'}
          iconName={sampleIGSN ? 'barcode-outline' : 'add-circle-outline'}
          onPress={onViewIGSNPressed}
          title={sampleIGSN ? 'IGSN Data' : 'Get IGSN'}
        />
        {!isReadOnly && (
          <SampleActionButton
            accessibilityHint={isLinked ? 'Removes the link to StraboSamples'
              : 'Links this sample to a sample in StraboSamples'}
            iconName={isLinked ? 'unlink-outline' : 'link-outline'}
            onPress={linkOrUnlinkSample}
            title={isLinked ? 'Unlink' : 'Link Sample'}
          />
        )}
      </View>
      <IGSNModal
        isVisible={isIGSNModalVisible}
        onIGSNUpdated={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
        onModalCancel={() => setIsIGSNModalVisible(false)}
        openLoginPage={() => {
          setIsIGSNModalVisible(false);
          setTimeout(() => {
            openMainMenuPanel();
          }, 300);
        }}
        sampleValues={sampleValues}
      />
      <LinkSampleModal
        closeModal={closeLinkSampleModal}
        isVisible={isLinkSampleModalVisible}
      />
    </View>
  );
};

export default SampleDetailOverview;
