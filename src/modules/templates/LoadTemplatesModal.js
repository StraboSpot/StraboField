import React, {useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {keepLocalCopy, types} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {useDispatch, useSelector} from 'react-redux';

import {TEMPLATE_BACKUP_MESSAGES, TEMPLATE_BACKUP_STATUS} from './templates.constants';
import useSafeDocumentPicker from '../../services/device/useSafeDocumentPicker';
import {DARKGREY, MODAL_TEXT_SIZE, PRIMARY_TEXT_COLOR, PRIMARY_TEXT_SIZE} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../utils/animations/LottieAnimations';
import {setLoadingStatus as setHomeLoadingStatus} from '../home/home.slice';
import {updatedProject} from '../project/projects.slice';

const LoadTemplatesModal = ({closeModal}) => {

  /* Data Hooks */

  const dispatch = useDispatch();
  const matchedTemplates = useSelector(state => state.project.project?.templates) || {};

  const {safePick} = useSafeDocumentPicker();

  /* Local State */

  const [loadingStatus, setLoadingStatus_] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  /* Event Handlers */

  const handleLoad = async () => {
    try {
      const result = await safePick({type: [types.json]});
      if (!result) return;

      const [{name, uri}] = result;
      if (!name || !uri) throw new Error('Invalid file selected.');

      setLoadingStatus_(TEMPLATE_BACKUP_STATUS.IN_PROGRESS);
      dispatch(setHomeLoadingStatus({view: 'home', bool: true}));

      const [localCopy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{uri, fileName: name}],
        transitionStyle: Platform.OS === 'ios' && 'flipHorizontal',
        type: [types.json],
      });

      if (localCopy.status !== 'success') throw new Error('Could not access the selected file.');

      const fileContent = await RNFS.readFile(localCopy.localUri, 'utf8');
      const importedTemplates = JSON.parse(fileContent);

      if (!importedTemplates || typeof importedTemplates !== 'object' || Array.isArray(importedTemplates)) {
        throw new Error('File does not contain a valid templates object.');
      }

      const {mergedTemplates, newCount, mergedCount} = mergeTemplates(matchedTemplates, importedTemplates);
      dispatch(updatedProject({field: 'templates', value: mergedTemplates}));

      setStatusMessage(`Added ${newCount} new templates, merged ${mergedCount} existing.`);
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
          doesLoop={loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS}
          show
          type={loadingStatus === TEMPLATE_BACKUP_STATUS.IN_PROGRESS ? 'loadingFile'
            : loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? 'complete' : 'error'}
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
      actionTitle={loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? 'Done' : actionLabel}
      closeModal={closeModal}
      headerTitle={modalTitle}
      onActionPressed={loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE ? closeModal : handleLoad}
      onCancelPress={closeModal}
      showActionButton={loadingStatus === '' || loadingStatus === TEMPLATE_BACKUP_STATUS.COMPLETE || loadingStatus === TEMPLATE_BACKUP_STATUS.ERROR}
      showCancelButton={loadingStatus === ''}
      showCloseButton
    >
      {renderContent()}
    </ModalWrapper>
  );
};

export default LoadTemplatesModal;
