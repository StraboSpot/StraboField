import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {keepLocalCopy, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {useDispatch, useSelector} from 'react-redux';

import {TAG_BACKUP_MESSAGES, TAG_BACKUP_STATUS, TAG_TYPES} from './tags.constants';
import useSafeDocumentPicker from '../../services/device/useSafeDocumentPicker';
import {
  DARKGREY,
  MODAL_TEXT_SIZE,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  WARNING_COLOR,
} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../utils/animations/LottieAnimations';
import {PROJECT_SAVE_STATUS} from '../connections/connections.constants';
import {setLoadingStatus as setHomeLoadingStatus} from '../home/home.slice';
import {updatedProject} from '../project/projects.slice';

const LoadTagsModal = ({closeModal, isGeologicUnits}) => {

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentTags = useSelector(state => state.project.project?.tags) || [];
  const projectSaveStatus = useSelector(state => state.connections.projectSaveStatus);

  const {safePick} = useSafeDocumentPicker();

  /* Local State */

  const [loadingStatus, setLoadingStatus_] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

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
  // Web writes go straight to the server, so the import isn't done until that save comes back
  const shouldWaitForServerSave = Platform.OS === 'web';
  // Shown up front and repeated after a rejected file, so both say the same thing
  const chooseFileText = `Choose a .json file exported from ${title}.`;

  /* Side Effects */

  // Deps are the save status alone: adding loadingStatus would let a stale SAVED finish the next import early.
  useEffect(() => {
    if (!shouldWaitForServerSave || loadingStatus !== TAG_BACKUP_STATUS.IN_PROGRESS) return;
    const isSaved = projectSaveStatus === PROJECT_SAVE_STATUS.SAVED;
    if (!isSaved && projectSaveStatus !== PROJECT_SAVE_STATUS.ERROR) return;

    setStatusMessage(message => `${message} ${isSaved ? 'Changes saved.' : 'Changes NOT saved.'}`);
    setLoadingStatus_(isSaved ? TAG_BACKUP_STATUS.COMPLETE : TAG_BACKUP_STATUS.ERROR);
    dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
  }, [projectSaveStatus]);

  /* Event Handlers */

  const handleLoad = async () => {
    setValidationMessage('');
    try {
      const result = await safePick({type: [types.json]});
      if (!result) return; // User canceled

      const [{name, uri}] = result;
      if (!name || !uri) return failValidation('Could not read the selected file.');

      setLoadingStatus_(TAG_BACKUP_STATUS.IN_PROGRESS);
      dispatch(setHomeLoadingStatus({view: 'home', bool: true}));

      const [localCopy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{uri, fileName: name}],
        transitionStyle: Platform.OS === 'ios' && 'flipHorizontal',
        type: [types.json],
      });

      if (localCopy.status !== 'success') return failValidation('Could not read the selected file.');

      const fileContent = await RNFS.readFile(localCopy.localUri, 'utf8');

      // The picker's type filter is only a hint (the browser allows All Files), so anything can land here
      let importedTags;
      try {
        importedTags = JSON.parse(fileContent);
      }
      catch (err) {
        console.log('Selected file is not valid JSON:', err);
        return failValidation('The selected file isn\'t valid JSON.');
      }

      if (!Array.isArray(importedTags)) return failValidation(`The selected file isn't a ${title} backup.`);

      const validTags = importedTags.filter(t => t && typeof t === 'object' && 'id' in t
        && (isGeologicUnits ? t.type === TAG_TYPES.GEOLOGIC_UNIT : t.type !== TAG_TYPES.GEOLOGIC_UNIT));
      if (validTags.length === 0) return failValidation(`The selected file has no ${title} in it.`);

      const mergedTags = mergeTags(currentTags, validTags);
      dispatch(updatedProject({field: 'tags', value: mergedTags}));

      const newCount = validTags.filter(t => !currentTags.find(e => e.id === t.id)).length;
      const mergedCount = validTags.length - newCount;
      setStatusMessage(`Added ${newCount} new ${nounForCount(newCount)}, merged ${mergedCount} existing.`);
      if (shouldWaitForServerSave) return;  // The side effect above reports completion once the server save lands

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

  // 'Tags' → 'tag' or 'tags' to match the count
  const nounForCount = count => (count === 1 ? title.slice(0, -1) : title).toLowerCase();

  // A wrong file isn't a failed import — send the user back to the picker with the reason
  const failValidation = (reason) => {
    setValidationMessage(`${reason} ${chooseFileText}`);
    setLoadingStatus_('');
    dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
  };

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
      const instructionText = `${chooseFileText} ${title} with matching IDs will be merged — new properties are `
        + `added, existing ones are kept. ${title} with new IDs will be added.`;
      return (
        <View style={{padding: 16}}>
          <Text style={{fontSize: PRIMARY_TEXT_SIZE, color: PRIMARY_TEXT_COLOR}}>{instructionText}</Text>
          {validationMessage !== '' && (
            <Text style={{fontSize: PRIMARY_TEXT_SIZE, color: WARNING_COLOR, marginTop: 12}}>
              {validationMessage}
            </Text>
          )}
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
          <Text style={{fontSize: MODAL_TEXT_SIZE, color: DARKGREY, marginTop: 12, textAlign: 'center'}}>
            {statusMessage}
          </Text>
        )}
      </View>
    );
  };

  /* View */

  // The action button opens the file picker rather than importing, so it's labeled for what it does
  return (
    <ModalWrapper
      actionTitle={loadingStatus === TAG_BACKUP_STATUS.COMPLETE ? 'Done' : 'Select File'}
      closeModal={closeModal}
      headerTitle={modalTitle}
      onActionPressed={loadingStatus === TAG_BACKUP_STATUS.COMPLETE ? closeModal : handleLoad}
      onCancelPress={closeModal}
      showActionButton={loadingStatus !== TAG_BACKUP_STATUS.IN_PROGRESS}
      showCancelButton={loadingStatus === ''}
      showCloseButton
    >
      {renderContent()}
    </ModalWrapper>
  );
};

export default LoadTagsModal;
