import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import LinkedSampleCard from './LinkedSampleCard';
import LinkSampleModal from './LinkSampleModal';
import SampleActionButton from './SampleActionButton';
import {SAMPLE_IGSN_KEY} from './samples.constants';
import sampleStyles from './samples.styles';
import useLinkSampleAction from './useLinkSampleAction';
import useSamples from './useSamples';
import commonStyles from '../../shared/common.styles';
import {truncateText} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import useForm from '../form/useForm';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import UploadModal from '../project/backup/UploadModal';
import useBackupUpload from '../project/backup/useBackupUpload';
import {setSelectedAttributes} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';

const SampleDetailOverview = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {closeUploadModal, isUploadAutoStart, isUploadModalVisible, startUploadFromStatus} = useBackupUpload();
  const {getLabel, getSurvey} = useForm();
  const {
    closeLinkSampleModal,
    isLinkOrUnlinkDisabled,
    isLinkSampleModalVisible,
    isLinked,
    linkOrUnlinkSample,
  } = useLinkSampleAction();
  const {openSamplePage, openUploadedSamplePage} = useSamples();
  const {isSpotReadOnly} = useSpots();

  /* Derived Variables */

  const sampleValues = spot.properties?.samples?.[0];
  const sampleIGSN = sampleValues?.[SAMPLE_IGSN_KEY];
  const isReadOnly = isSpotReadOnly(spot);
  // Viewing an existing IGSN is fine read-only; getting one would change the sample
  const isGetIGSNHidden = !sampleIGSN && isReadOnly;

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

  // Unlinking drops the Micro and Experimental data that came with the link, so it is confirmed
  const onUnlinkPressed = () => {
    alert('Unlink Sample?', 'This sample will no longer be linked to StraboSamples, and its Micro and Experimental'
      + ' data will be removed from it.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Unlink', style: 'destructive', onPress: linkOrUnlinkSample},
    ]);
  };

  const onIGSNPressed = () => openSamplePage(spot.properties.id, startUploadFromStatus);

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
      <LinkedSampleCard spot={spot}/>
      <View style={sampleStyles.actionButtonsContainer}>
        <SampleActionButton
          accessibilityHint={'Opens the full sample record'}
          iconName={'document-text-outline'}
          onPress={onViewDetailPressed}
          title={'Details'}
        />
        {!isGetIGSNHidden && (
          <SampleActionButton
            accessibilityHint={sampleIGSN ? 'Opens the sample\'s IGSN on strabospot.org'
              : 'Opens the sample on strabospot.org to get an IGSN'}
            iconName={sampleIGSN ? 'barcode-outline' : 'add-circle-outline'}
            onPress={onIGSNPressed}
            title={sampleIGSN ? 'IGSN Data' : 'Get IGSN'}
          />
        )}
        {!isReadOnly && (
          <SampleActionButton
            accessibilityHint={isLinked ? 'Removes the link to StraboSamples'
              : 'Links this sample to a sample in StraboSamples'}
            disabled={isLinkOrUnlinkDisabled}
            iconName={isLinked ? 'unlink-outline' : 'link-outline'}
            onPress={isLinked ? onUnlinkPressed : linkOrUnlinkSample}
            title={isLinked ? 'Unlink' : 'Link Sample'}
          />
        )}
      </View>
      {!isReadOnly && isLinkOrUnlinkDisabled && (
        <Text style={sampleStyles.offlineNote}>Linking a sample needs an internet connection</Text>
      )}
      <UploadModal
        afterUploadActionTitle={sampleIGSN ? 'View IGSN' : 'Get IGSN'}
        autoStart={isUploadAutoStart}
        closeModal={closeUploadModal}
        isVisible={isUploadModalVisible}
        onAfterUploadActionPressed={() => openUploadedSamplePage(spot.properties.id)}
      />
      <LinkSampleModal
        closeModal={closeLinkSampleModal}
        isVisible={isLinkSampleModalVisible}
      />
    </View>
  );
};

export default SampleDetailOverview;
