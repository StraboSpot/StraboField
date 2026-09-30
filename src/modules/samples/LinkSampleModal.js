import React, {useEffect, useState} from 'react';
import {FlatList, Pressable, ScrollView, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {SAMPLE_FORM_NAME, SAMPLE_LOCATION_KEY} from './samples.constants';
import {
  getSampleDifferences,
  getSamplesLinkedTo,
  getSampleTitle,
  getStraboSampleFromResponse,
  getStraboSamplesId,
  isLinkedToOtherFieldSpot,
} from './samples.helpers';
import useSamples from './useSamples';
import useServerRequests from '../../services/network/useServerRequests';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import ListQueryBar from '../../shared/ui/ListQueryBar';
import Loading from '../../shared/ui/Loading';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import ConnectionRequiredMessage from '../../shared/ui/text/ConnectionRequiredMessage';
import {LABEL_DICTIONARY} from '../form/form.constants';
import useForm from '../form/useForm';

const LinkSampleModal = ({closeModal, isVisible}) => {
  /* Data Hooks */

  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {getMySamples, getStraboSample} = useServerRequests();
  const {getLabel} = useForm();
  const {getSelectedSample, getSelectedSampleGeometry, linkSample} = useSamples();
  const toast = useToast();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [searchText, setSearchText] = useState('');
  // The StraboSamples keys whose values are taken over the Field sample's, picked while reviewing
  const [keysToTake, setKeysToTake] = useState([]);
  // A picked sample held for review, until the user has seen any warnings and picked between the values that differ
  const [sampleToReview, setSampleToReview] = useState(null);

  /* Derived Variables */

  const isOnline = isConnected && isInternetReachable;
  const fieldSample = getSelectedSample() ?? {};
  const searchTextLowerCase = searchText.trim().toLowerCase();
  const filteredSamples = isEmpty(searchTextLowerCase) ? samples
    : samples.filter(sample => sample.name?.toLowerCase().includes(searchTextLowerCase));
  const isReviewing = !isLoading && !isEmpty(sampleToReview);

  /* Side Effects */

  useEffect(() => {
    setSampleToReview(null);
    setSearchText('');
    if (isVisible && isOnline) loadSamples();
  }, [isVisible, isOnline]);

  /* Event Handlers */

  const onLinkPressed = () => link(sampleToReview.strabosample, keysToTake);

  const onSamplePressed = async (item) => {
    try {
      setErrorMessage('');
      setIsLoading(true);
      const strabosample = getStraboSampleFromResponse(await getStraboSample(getStraboSamplesId(item)));
      // Only ever link the id the user picked, so a response for anything else is an error rather than a link
      if (isEmpty(strabosample?.id) || getStraboSamplesId(strabosample) !== getStraboSamplesId(item)) {
        throw new Error('StraboSamples returned a different sample than the one picked.');
      }
      const warnings = getLinkWarnings(strabosample);
      const differences = getSampleDifferences(fieldSample, strabosample, getSelectedSampleGeometry());
      if (isEmpty(warnings) && isEmpty(differences)) link(strabosample, []);
      else {
        // A field the Field sample left empty starts on the StraboSamples value, and one it filled in on its own
        setKeysToTake(differences.filter(d => isEmpty(d.fieldValue)).map(d => d.key));
        setSampleToReview({differences, strabosample, warnings});
      }
    }
    catch (err) {
      console.error('Error getting sample from StraboSamples', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
    finally {
      setIsLoading(false);
    }
  };

  const onValuePressed = (key, isTaking) => {
    setKeysToTake(keys => isTaking ? [...new Set([...keys, key])] : keys.filter(k => k !== key));
  };

  /* Logic Helpers */

  // A value as the sample form shows it: a choice by its label, anything else as it was entered. A location is
  // [longitude, latitude], shown latitude first as it is read.
  const formatValue = (key, value) => {
    if (isEmpty(value)) return 'Empty';
    if (key === SAMPLE_LOCATION_KEY) return `${value[1]}, ${value[0]}`;
    const [category, name] = SAMPLE_FORM_NAME;
    return [].concat(value).map(v => LABEL_DICTIONARY[category]?.[name]?.[v] ?? String(v)).join(', ');
  };

  const getLinkWarnings = (strabosample) => {
    const warnings = getSamplesLinkedTo(spots, getStraboSamplesId(strabosample), fieldSample.id).map(sample => `${getSampleTitle(sample)} in this project is already linked to this sample.`);
    // The server knows a link by the Spot holding the sample, which is the Spot open in the notebook either way: a rich
    // sample's own Spot, or the parent of a sample kept on it. Linking moves that sample to a Spot of its own under its
    // own id, so a link to either one is this sample's.
    if (isEmpty(warnings) && isLinkedToOtherFieldSpot(strabosample, [selectedSpot.properties.id, fieldSample.id])) {
      warnings.push('StraboSamples already has this sample linked to a different Field sample.');
    }
    return warnings;
  };

  const link = (strabosample, keys) => {
    if (isEmpty(getSelectedSample())) {
      setErrorMessage('This sample can\'t be linked from here. Open the Sample itself and link it there.');
      setSampleToReview(null);
      return;
    }
    closeModal();
    if (linkSample(strabosample, keys)) {
      toast.show(`Linked to ${strabosample.name || 'StraboSamples sample'}`, {type: 'success'});
    }
  };

  const loadSamples = async () => {
    try {
      setErrorMessage('');
      setIsLoading(true);
      // mysamples also returns samples shared with the user, which can't be linked yet, so offer only their own.
      // Without the user's id there is no telling which those are, so offer none rather than risk a shared one.
      if (isEmpty(straboUserId)) throw new Error('Your user profile has not loaded yet. Please try again shortly.');
      const response = await getMySamples();
      // userpkey and straboUserId may differ in type, so compare them as strings
      setSamples((response?.samples || []).filter(sample => String(sample.userpkey) === String(straboUserId)));
    }
    catch (err) {
      console.error('Error getting samples from StraboSamples', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setSamples([]);
    }
    finally {
      setIsLoading(false);
    }
  };

  /* Render Functions */

  const renderDifference = ({fieldValue, key, strabosamplesValue}) => {
    const isTaking = keysToTake.includes(key);
    return (
      <View key={key} style={{paddingVertical: 5}}>
        <Text style={[commonStyles.listItemTitle, {fontWeight: 'bold'}]}>{key === SAMPLE_LOCATION_KEY ? 'Location (Latitude, Longitude)'
          : getLabel(key, SAMPLE_FORM_NAME)}</Text>
        {renderValueOption(key, false, !isTaking, 'This Sample', fieldValue)}
        {renderValueOption(key, true, isTaking, 'StraboSamples', strabosamplesValue)}
      </View>
    );
  };

  const renderReview = () => (
    <ScrollView contentContainerStyle={{padding: 10, gap: 10}}>
      <Text style={commonStyles.listItemTitle}>
        Link to <Text style={{fontWeight: 'bold'}}>{sampleToReview.strabosample.name}</Text>?
      </Text>
      {sampleToReview.warnings.map(warning => (
        <Text key={warning} style={commonStyles.importantText}>{warning}</Text>
      ))}
      {!isEmpty(sampleToReview.warnings) && (
        <Text style={commonStyles.listItemTitle}>
          Only one Field sample can hold the link. Whichever is uploaded last takes it.
        </Text>
      )}
      {!isEmpty(sampleToReview.differences) && (
        <>
          <Text style={commonStyles.listItemTitle}>
            These fields differ. Pick the value to keep for each. Fields StraboSamples leaves empty keep this
            sample's value.
          </Text>
          {sampleToReview.differences.map(renderDifference)}
        </>
      )}
      <Pressable onPress={() => setSampleToReview(null)}>
        <Text style={[commonStyles.listItemTitle, {color: PRIMARY_ACCENT_COLOR, paddingTop: 5}]}>
          Choose a Different Sample
        </Text>
      </Pressable>
    </ScrollView>
  );

  const renderContent = () => {
    if (!isOnline) return <ConnectionRequiredMessage actionText={'link a sample'} isInternetRequired/>;
    if (isLoading) return <Loading isLoading style={{position: 'relative', flex: 1}}/>;
    if (sampleToReview) return renderReview();
    return (
      <>
        <ListQueryBar onSearchChange={setSearchText} searchValue={searchText}/>
        {errorMessage ? <Text style={commonStyles.importantText}>{errorMessage}</Text> : null}
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={errorMessage ? null
            : <ListEmptyText text={isEmpty(searchTextLowerCase) ? 'No Samples found' : 'No Samples match your search'}/>}
          data={filteredSamples}
          // id may be numeric or a UUID, so it is always kept as a string
          keyExtractor={item => getStraboSamplesId(item)}
          keyboardShouldPersistTaps={'handled'}
          renderItem={renderSampleItem}
        />
      </>
    );
  };

  const renderSampleItem = ({item}) => (
    <ListItem containerStyle={commonStyles.listItem} onPress={() => onSamplePressed(item)}>
      <ListItem.Content>
        <ListItem.Title style={commonStyles.listItemTitle}>{item.name || 'Unnamed Sample'}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );

  const renderValueOption = (key, isStraboSamplesValue, isChecked, source, value) => (
    <Pressable
      onPress={() => onValuePressed(key, isStraboSamplesValue)}
      style={{alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 4}}
    >
      <Icon
        color={PRIMARY_ACCENT_COLOR}
        name={isChecked ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={20}
      />
      <Text style={[commonStyles.listItemTitle, {flexShrink: 1}]}>
        <Text style={{fontStyle: 'italic'}}>{source}: </Text>{formatValue(key, value)}
      </Text>
    </Pressable>
  );

  /* View */

  return (
    <ModalWrapper
      actionTitle={isEmpty(sampleToReview?.warnings) ? 'Link' : 'Link Anyway'}
      closeModal={closeModal}
      headerTitle={'Link Sample'}
      isChildrenFilled
      isVisible={isVisible}
      onActionPressed={onLinkPressed}
      onBackdropPress={closeModal}
      overlayStyleOverride={{maxHeight: '80%'}}
      showActionButton={isReviewing}
      showCancelButton={false}
      showCloseButton
    >
      <View style={{flex: 1}}>
        {renderContent()}
      </View>
    </ModalWrapper>
  );
};

export default LinkSampleModal;
