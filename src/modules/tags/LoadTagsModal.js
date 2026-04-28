import React, {useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {keepLocalCopy, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {useDispatch, useSelector} from 'react-redux';

import {TAG_BACKUP_MESSAGES, TAG_BACKUP_STATUS} from './tags.constants';
import useSafeDocumentPicker from '../../services/device/useSafeDocumentPicker';
import {DARKGREY, MODAL_TEXT_SIZE, PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../utils/animations/LottieAnimations';
import {setLoadingStatus as setHomeLoadingStatus} from '../home/home.slice';
import {updatedProject} from '../project/projects.slice';

const LoadTagsModal = ({closeModal, isGeologicUnits}) => {

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentTags = useSelector(state => state.project.project?.tags) || [];

  const {safePick} = useSafeDocumentPicker();

  /* Local State */

  const [loadingStatus, setLoadingStatus_] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  /* Derived Variables */

  const actionLabel = Platform.OS === 'ios' ? 'Load' : 'Import';
  const title = isGeologicUnits ? TAG_BACKUP_MESSAGES.TITLE.GEOLOGIC_UNITS : TAG_BACKUP_MESSAGES.TITLE.TAGS;
  const modalTitle = loadingStatus === ''
    ? `${actionLabel} ${title}`
    : loadingStatus === TAG_BACKUP_STATUS.IN_PROGRESS
      ? `${actionLabel === 'Load' ? 'Loading' : 'Importing'} ${title}...`
      : loadingStatus === TAG_BACKUP_STATUS.COMPLETE
        ? `${title} Imported`
        : 'Import Failed';

  /* Event Handlers */

  const handleLoad = async () => {
    try {
      const result = await safePick({type: [types.json]});
      if (!result) return; // User canceled

      const [{name, uri}] = result;
      if (!name || !uri) throw new Error('Invalid file selected.');

      setLoadingStatus_(TAG_BACKUP_STATUS.IN_PROGRESS);
      dispatch(setHomeLoadingStatus({view: 'home', bool: true}));

      const [localCopy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{uri, fileName: name}],
        transitionStyle: Platform.OS === 'ios' && 'flipHorizontal',
        type: [types.json],
      });

      if (localCopy.status !== 'success') throw new Error('Could not access the selected file.');

      const fileContent = await RNFS.readFile(localCopy.localUri, 'utf8');
      const importedTags = JSON.parse(fileContent);

      if (!Array.isArray(importedTags)) throw new Error('File does not contain a valid tags array.');

      const expectedType = isGeologicUnits ? 'geologic_unit' : null;
      const validTags = importedTags.filter(t => t && typeof t === 'object' && 'id' in t
        && (isGeologicUnits ? t.type === expectedType : t.type !== 'geologic_unit'));
      if (validTags.length === 0) {
        throw new Error(`No valid ${title.toLowerCase()} found in the selected file.`);
      }

      const mergedTags = mergeTags(currentTags, validTags);
      dispatch(updatedProject({field: 'tags', value: mergedTags}));

      const newCount = validTags.filter(t => !currentTags.find(e => e.id === t.id)).length;
      const mergedCount = validTags.length - newCount;
      setStatusMessage(`Added ${newCount} new ${title.toLowerCase()}, merged ${mergedCount} existing.`);
      setLoadingStatus_(TAG_BACKUP_STATUS.COMPLETE);
      dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      console.error('Error loading tags:', err);
      setStatusMessage(err.message || 'An unknown error occurred.');
      setLoadingStatus_(TAG_BACKUP_STATUS.ERROR);
      dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
    }
  };

  /* Logic Helpers */

  const mergeTags = (existingTags, importedTags) => {
    const merged = [...existingTags];
    for (const importedTag of importedTags) {
      const existingIndex = merged.findIndex(t => t.id === importedTag.id);
      if (existingIndex >= 0) {
        // Keep existing properties; only add properties missing from the existing tag
        merged[existingIndex] = {...importedTag, ...merged[existingIndex]};
      }
      else {
        merged.push(importedTag);
      }
    }
    return merged;
  };

  /* Render Functions */

  const renderContent = () => {
    if (loadingStatus === '') {
      const instructionText = `Select a JSON file from which to ${actionLabel.toLowerCase()} ${title.toLowerCase()}. `
        + `${title} with matching IDs will be merged — any new properties will be added, but existing properties will not be overwritten. `
        + `${title} with new IDs will be added.`;
      return (
        <View style={{padding: 16}}>
          <Text style={{fontSize: PRIMARY_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}>{instructionText}</Text>
        </View>
      );
    }
    return (
      <View style={{padding: 20, alignItems: 'center'}}>
        <LottieAnimations
          doesLoop={loadingStatus === TAG_BACKUP_STATUS.IN_PROGRESS}
          show
          type={loadingStatus === TAG_BACKUP_STATUS.IN_PROGRESS ? 'loadingFile'
            : loadingStatus === TAG_BACKUP_STATUS.COMPLETE ? 'complete' : 'error'}
        />
        {statusMessage !== '' && (
          <Text style={{
            marginTop: 12,
            textAlign: 'center',
            fontSize: MODAL_TEXT_SIZE,
            color: DARKGREY,
          }}>
            {statusMessage}
          </Text>
        )}
      </View>
    );
  };

  /* View */

  return (
    <ModalWrapper
      actionTitle={loadingStatus === TAG_BACKUP_STATUS.COMPLETE ? 'Done' : actionLabel}
      closeModal={closeModal}
      headerTitle={modalTitle}
      onActionPressed={loadingStatus === TAG_BACKUP_STATUS.COMPLETE ? closeModal : handleLoad}
      onCancelPress={closeModal}
      showActionButton={loadingStatus === '' || loadingStatus === TAG_BACKUP_STATUS.COMPLETE || loadingStatus === TAG_BACKUP_STATUS.ERROR}
      showCancelButton={loadingStatus === ''}
      showCloseButton
    >
      {renderContent()}
    </ModalWrapper>
  );
};

export default LoadTagsModal;
