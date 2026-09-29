import React, {useEffect, useState} from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';
import {useSelector} from 'react-redux';

import {
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

const LinkSampleModal = ({closeModal, isVisible}) => {
  /* Data Hooks */

  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);
  const straboUserId = useSelector(state => state.user.straboUserId);

  const {getMySamples, getStraboSample} = useServerRequests();
  const {getSelectedSample, linkSample} = useSamples();
  const toast = useToast();

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [samples, setSamples] = useState([]);
  const [searchText, setSearchText] = useState('');
  // A picked sample already linked elsewhere, held until the user confirms linking it anyway
  const [sampleToConfirm, setSampleToConfirm] = useState(null);

  /* Derived Variables */

  const isOnline = isConnected && isInternetReachable;
  const fieldSample = getSelectedSample() ?? {};
  const searchTextLowerCase = searchText.trim().toLowerCase();
  const filteredSamples = isEmpty(searchTextLowerCase) ? samples
    : samples.filter(sample => sample.name?.toLowerCase().includes(searchTextLowerCase));
  const isConfirming = !isLoading && !isEmpty(sampleToConfirm);

  /* Side Effects */

  useEffect(() => {
    setSampleToConfirm(null);
    setSearchText('');
    if (isVisible && isOnline) loadSamples();
  }, [isVisible, isOnline]);

  /* Event Handlers */

  const onLinkAnywayPressed = () => link(sampleToConfirm.strabosample);

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
      if (isEmpty(warnings)) link(strabosample);
      else setSampleToConfirm({strabosample, warnings});
    }
    catch (err) {
      console.error('Error getting sample from StraboSamples', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
    finally {
      setIsLoading(false);
    }
  };

  /* Logic Helpers */

  const getLinkWarnings = (strabosample) => {
    const warnings = getSamplesLinkedTo(spots, getStraboSamplesId(strabosample), fieldSample.id).map(sample => `${getSampleTitle(sample)} in this project is already linked to this sample.`);
    // The server knows a link by the Spot holding the sample, which is the Spot open in the notebook either way: a rich
    // sample's own Spot, or the parent of a sample kept on it
    if (isEmpty(warnings) && isLinkedToOtherFieldSpot(strabosample, selectedSpot.properties.id)) {
      warnings.push('StraboSamples already has this sample linked to a different Field sample.');
    }
    return warnings;
  };

  const link = (strabosample) => {
    if (isEmpty(getSelectedSample())) {
      setErrorMessage('This sample can\'t be linked from here. Open the Sample itself and link it there.');
      setSampleToConfirm(null);
      return;
    }
    linkSample(strabosample);
    closeModal();
    toast.show(`Linked to ${strabosample.name || 'StraboSamples sample'}`, {type: 'success'});
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

  const renderConfirm = () => (
    <View style={{padding: 10, gap: 10}}>
      <Text style={commonStyles.listItemTitle}>
        Link to <Text style={{fontWeight: 'bold'}}>{sampleToConfirm.strabosample.name}</Text>?
      </Text>
      {sampleToConfirm.warnings.map(warning => (
        <Text key={warning} style={commonStyles.importantText}>{warning}</Text>
      ))}
      <Text style={commonStyles.listItemTitle}>
        Only one Field sample can hold the link. Whichever is uploaded last takes it.
      </Text>
      <Pressable onPress={() => setSampleToConfirm(null)}>
        <Text style={[commonStyles.listItemTitle, {color: PRIMARY_ACCENT_COLOR, paddingTop: 5}]}>
          Choose a Different Sample
        </Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (!isOnline) return <ConnectionRequiredMessage actionText={'link a sample'} isInternetRequired/>;
    if (isLoading) return <Loading isLoading style={{position: 'relative', flex: 1}}/>;
    if (sampleToConfirm) return renderConfirm();
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

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Link Anyway'}
      closeModal={closeModal}
      headerTitle={'Link Sample'}
      isChildrenFilled
      isVisible={isVisible}
      onActionPressed={onLinkAnywayPressed}
      onBackdropPress={closeModal}
      overlayStyleOverride={{maxHeight: '80%'}}
      showActionButton={isConfirming}
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
