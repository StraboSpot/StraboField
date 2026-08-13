import React, {useEffect, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {keepLocalCopy, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {useDispatch, useSelector} from 'react-redux';

import {TEMPLATE_BACKUP_MESSAGES, TEMPLATE_BACKUP_STATUS} from './templates.constants';
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

// Generous on purpose: firing early would report a failure while the save is still genuinely in flight.
const SERVER_SAVE_TIMEOUT_MS = 60000;
// Deliberately non-committal — on a timeout the save may still land, so don't claim it failed.
const SERVER_SAVE_TIMEOUT_MESSAGE = 'Timed out waiting for the save to be confirmed.'
  + ' Check your project to be sure the changes were saved.';

const LoadTemplatesModal = ({closeModal}) => {

  /* Data Hooks */

  const dispatch = useDispatch();
  const matchedTemplates = useSelector(state => state.project.project?.templates) || {};
  const projectSaveStatus = useSelector(state => state.connections.projectSaveStatus);

  const {safePick} = useSafeDocumentPicker();

  /* Local State */

  const [loadingStatus, setLoadingStatus_] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  /* Derived Variables */

  const actionLabel = Platform.OS === 'ios' ? 'Load' : 'Import';
  const title = TEMPLATE_BACKUP_MESSAGES.TITLE;
  const modalTitle = loadingStatus === ''
    ? `${actionLabel} ${title}`
    : loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS
      ? `${actionLabel === 'Load' ? 'Loading' : 'Importing'} ${title}...`
      : loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE
        ? `${title} Imported`
        : 'Import Failed';
  // Web writes go straight to the server, so the import isn't done until that save comes back
  const shouldWaitForServerSave = Platform.OS === 'web';
  // Shown up front and repeated after a rejected file, so both say the same thing
  const chooseFileText = `Choose a .json file exported from ${title}.`;

  /* Side Effects */

  // Deps are the save status alone: adding loadingStatus would let a stale SAVED finish the next import early.
  useEffect(() => {
    if (!shouldWaitForServerSave || loadingStatus !== TEMPLATE_BACKUP_STATUS.IN_PROGRESS) return;
    const isSaved = projectSaveStatus === PROJECT_SAVE_STATUS.SAVED;
    if (!isSaved && projectSaveStatus !== PROJECT_SAVE_STATUS.ERROR) return;

    setStatusMessage(message => `${message} ${isSaved ? 'Changes saved.' : 'Changes NOT saved.'}`);
    setLoadingStatus_(isSaved ? TEMPLATE_BACKUP_STATUS.COMPLETE : TEMPLATE_BACKUP_STATUS.ERROR);
    dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
  }, [projectSaveStatus]);

  // Bounds the wait above, which resolves only when the server reports back. The modal closes both its exits while
  // the import is in progress, so a status that never arrives would leave it with no way out.
  useEffect(() => {
    if (!shouldWaitForServerSave || loadingStatus !== TEMPLATE_BACKUP_STATUS.IN_PROGRESS) return;
    const timeoutId = setTimeout(() => {
      setStatusMessage(message => `${message} ${SERVER_SAVE_TIMEOUT_MESSAGE}`);
      setLoadingStatus_(TEMPLATE_BACKUP_STATUS.ERROR);
      dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
    }, SERVER_SAVE_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [loadingStatus, shouldWaitForServerSave]);

  /* Event Handlers */

  const handleLoad = async () => {
    setValidationMessage('');
    try {
      const result = await safePick({type: [types.json]});
      if (!result) return;

      const [{name, uri}] = result;
      if (!name || !uri) return failValidation('Could not read the selected file.');

      setLoadingStatus_(TEMPLATE_BACKUP_STATUS.IN_PROGRESS);
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
      let importedTemplates;
      try {
        importedTemplates = JSON.parse(fileContent);
      }
      catch (err) {
        console.log('Selected file is not valid JSON:', err);
        return failValidation('The selected file isn\'t valid JSON.');
      }

      if (!importedTemplates || typeof importedTemplates !== 'object' || Array.isArray(importedTemplates)) {
        return failValidation(`The selected file isn't a ${title} backup.`);
      }

      const {mergedTemplates, newCount, mergedCount} = mergeTemplates(matchedTemplates, importedTemplates);
      // A JSON object with no template-shaped keys merges to nothing — a wrong pick, not an empty import
      if (newCount === 0 && mergedCount === 0) return failValidation(`The selected file has no ${title} in it.`);

      dispatch(updatedProject({field: 'templates', value: mergedTemplates}));

      setStatusMessage(`Added ${newCount} new ${nounForCount(newCount)}, merged ${mergedCount} existing.`);
      if (shouldWaitForServerSave) return;  // The side effect above reports completion once the server save lands

      setLoadingStatus_(TEMPLATE_BACKUP_STATUS.COMPLETE);
      dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
    }
    catch (err) {
      console.error('Error loading templates:', err);
      setStatusMessage(err.message || 'An unknown error occurred.');
      setLoadingStatus_(TEMPLATE_BACKUP_STATUS.ERROR);
      dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
    }
  };

  /* Logic Helpers */

  // 'Templates' → 'template' or 'templates' to match the count
  const nounForCount = count => (count === 1 ? title.slice(0, -1) : title).toLowerCase();

  // A wrong file isn't a failed import — send the user back to the picker with the reason
  const failValidation = (reason) => {
    setValidationMessage(`${reason} ${chooseFileText}`);
    setLoadingStatus_('');
    dispatch(setHomeLoadingStatus({view: 'home', bool: false}));
  };

  const mergeTemplateArray = (existing, imported) => {
    const merged = [...existing];
    let newCount = 0;
    let mergedCount = 0;
    for (const importedTemplate of imported) {
      const existingIndex = merged.findIndex(t => t.id === importedTemplate.id);
      if (existingIndex >= 0) {
        const matchedTemplate = merged[existingIndex];
        const mergedValues = {...importedTemplate.values};
        for (const [k, v] of Object.entries(matchedTemplate.values || {})) {
          if (v !== undefined && v !== null) mergedValues[k] = v;
        }
        merged[existingIndex] = {...importedTemplate, ...matchedTemplate, values: mergedValues};
        mergedCount++;
      }
      else {
        merged.push(importedTemplate);
        newCount++;
      }
    }
    return {merged, newCount, mergedCount};
  };

  const mergeTemplates = (existing, imported) => {
    const mergedTemplates = {...existing};
    let totalNew = 0;
    let totalMerged = 0;

    for (const key of Object.keys(imported)) {
      if (key === 'measurementTemplates' && Array.isArray(imported[key])) {
        const existingArr = existing.measurementTemplates || [];
        const {merged, newCount, mergedCount} = mergeTemplateArray(existingArr, imported[key]);
        mergedTemplates.measurementTemplates = merged;
        totalNew += newCount;
        totalMerged += mergedCount;
      }
      else if (imported[key] && typeof imported[key] === 'object' && Array.isArray(imported[key].templates)) {
        const existingArr = existing[key]?.templates || [];
        const {merged, newCount, mergedCount} = mergeTemplateArray(existingArr, imported[key].templates);
        mergedTemplates[key] = {...(existing[key] || {}), templates: merged};
        totalNew += newCount;
        totalMerged += mergedCount;
      }
    }

    return {mergedTemplates, newCount: totalNew, mergedCount: totalMerged};
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
          doesLoop={loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS}
          type={loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS ? 'loadingFile'
            : loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? 'complete' : 'error'}
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
      actionTitle={loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? 'Done' : 'Select File'}
      closeModal={closeModal}
      headerTitle={modalTitle}
      isLoading={loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS}
      onActionPressed={loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? closeModal : handleLoad}
      onCancelPress={closeModal}
      showActionButton={loadingStatus !== TEMPLATE_BACKUP_STATUS.IN_PROGRESS}
      showCancelButton={loadingStatus === ''}
      showCloseButton
    >
      {renderContent()}
    </ModalWrapper>
  );
};

export default LoadTemplatesModal;
