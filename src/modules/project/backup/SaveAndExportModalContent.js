import React from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {CheckBox} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {
  DARKGREY,
  MEDIUMGREY,
  NEGATIVE_COLOR,
  PRIMARY_BACKGROUND_COLOR,
  PRIMARY_TEXT_COLOR,
  PRIMARY_TEXT_SIZE,
  SMALL_TEXT_SIZE,
  TEXT_WEIGHT_700,
} from '../../../shared/styles.constants';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import {TAG_BACKUP_ACTIONS} from '../../tags/tags.constants';
import {TEMPLATE_BACKUP_ACTIONS} from '../../templates/templates.constants';

const SaveAndExportModalContent = ({
                                     backingUpStatus,
                                     backupAction,
                                     backupFileName,
                                     backupOptions,
                                     isFileNameError,
                                     setBackupFileName,
                                     setBackupOptions,
                                     setIsFileNameError,
                                   }) => {
  /* Data Hooks */

  const statusMessages = useSelector(state => state.home.statusMessages);

  /* Derived Variables */

  const backupActionTitle = backupAction === 'export' ? 'project'
    : backupAction === TAG_BACKUP_ACTIONS.BACKUP_TAGS ? 'Tags'
      : backupAction === TAG_BACKUP_ACTIONS.BACKUP_GEOLOGIC_UNITS ? 'Geologic Units'
        : backupAction === TEMPLATE_BACKUP_ACTIONS.BACKUP_TEMPLATES ? 'Templates'
          : 'project';
  const fileExtension = backupAction === 'export' ? '.zip' : '.json';
  const subFolder = backupAction === TAG_BACKUP_ACTIONS.BACKUP_TAGS ? 'Tags'
    : backupAction === TAG_BACKUP_ACTIONS.BACKUP_GEOLOGIC_UNITS ? 'GeologicUnits'
      : backupAction === TEMPLATE_BACKUP_ACTIONS.BACKUP_TEMPLATES ? 'Templates'
        : null;

  /* Logic Helpers */

  const getInstructionText = () => {
    if (backupAction === 'save') {
      return 'All datasets will be saved locally, along with any images and custom maps.';
    }
    // Web downloads through the browser, so the file lands wherever the browser is set to put downloads.
    if (Platform.OS === 'web') {
      return `Your ${backupActionTitle} will be downloaded as a ${fileExtension} file to your browser's download `
        + 'location.\n\nFile will be saved as:';
    }
    if (Platform.OS === 'ios') {
      return `Your ${backupActionTitle} will be saved as a ${fileExtension} file into the `
        + `StraboField/Distribution${subFolder ? '/' + subFolder : ''} folder.\n\nMove it out of StraboField `
        + 'using the iOS Files app.\n\nFile will be saved as:';
    }
    return `Your ${backupActionTitle} will be exported as a ${fileExtension} file into the `
      + `Downloads\\StraboSpot2\\Backups${subFolder ? '\\' + subFolder : ''} folder.\n\nFile will be saved as:`;
  };

  // Store the name exactly as it will be written to disk: this field previews it and the Backup modals pass
  // the same value straight to the export, so what's shown and what's saved must not diverge.
  const validateFileName = (filenameChanged) => {
    const regexp = /^[a-zA-Z0-9-_]*$/; // Check for alphanumeric characters, a dash or underscore (allow empty)
    const fileNameWithUnderscores = filenameChanged.replace(/\s/g, '_');
    if (fileNameWithUnderscores.search(regexp) === -1) setIsFileNameError(true);
    else setIsFileNameError(false);
    setBackupFileName(fileNameWithUnderscores);
  };

  /* Render Functions */

  const renderBackingUpView = () => (
    <View style={{padding: 20, alignItems: 'center'}}>
      <LottieAnimations
        doesLoop={backingUpStatus === 'inProgress'}
        show
        type={backingUpStatus === 'inProgress' ? 'loadingFile'
          : backingUpStatus === 'complete' ? 'complete' : 'error'}
      />
      {statusMessages.length > 0 && (
        <Text style={{marginTop: 12, textAlign: 'center', color: DARKGREY}}>
          {statusMessages.join('\n')}
        </Text>
      )}
    </View>
  );

  /* View */

  return (
    <>
      {backingUpStatus === '' ? (
        <View style={{padding: 16}}>
          {/* Instruction Text */}
          <Text style={{fontSize: PRIMARY_TEXT_SIZE, marginBottom: 12, color: DARKGREY}}>
            {getInstructionText()}
          </Text>

          {/* File Name Input */}
          <Text style={{fontWeight: TEXT_WEIGHT_700, marginBottom: 6}}>File Name</Text>
          <TextInput
            onChangeText={validateFileName}
            style={[
              {
                borderWidth: 1,
                borderColor: isFileNameError ? NEGATIVE_COLOR : MEDIUMGREY,
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                fontSize: PRIMARY_TEXT_SIZE,
                backgroundColor: PRIMARY_BACKGROUND_COLOR,
              },
            ]}
            value={backupFileName}
          />
          {isFileNameError && (
            <Text style={{color: NEGATIVE_COLOR, marginBottom: 8, fontSize: SMALL_TEXT_SIZE}}>
              File Name Error! Only letters, numbers, dashes, or underscores allowed.
            </Text>
          )}
          <Text style={{fontSize: SMALL_TEXT_SIZE, color: DARKGREY, marginBottom: 16}}>
            *File names cannot contain spaces or special characters. Do not include a file extension.
          </Text>

          {(backupAction === 'save' || backupAction === 'export') && (
            <View>
              <Text style={{fontWeight: TEXT_WEIGHT_700, marginBottom: 4}}>Include in Backup</Text>
              <CheckBox
                checked
                checkedColor={MEDIUMGREY}
                containerStyle={{backgroundColor: 'transparent', borderWidth: 0, padding: 4, marginLeft: 0}}
                disabled
                title={'Project Data (Spots, Datasets, Tags, Geologic Units, Memos, etc.)'}
                titleStyle={{color: DARKGREY, fontSize: SMALL_TEXT_SIZE}}
              />
              <CheckBox
                checked={backupOptions.images}
                containerStyle={{backgroundColor: 'transparent', borderWidth: 0, padding: 4, marginLeft: 0}}
                onPress={() => setBackupOptions(prev => ({...prev, images: !prev.images}))}
                title={'Images (Spots & Memos)'}
                titleStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}
              />
              <CheckBox
                checked={backupOptions.offlineTiles}
                containerStyle={{backgroundColor: 'transparent', borderWidth: 0, padding: 4, marginLeft: 0}}
                onPress={() => setBackupOptions(prev => ({...prev, offlineTiles: !prev.offlineTiles}))}
                title={'Offline Map Tiles'}
                titleStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}
              />
              <CheckBox
                checked={backupOptions.customMaps}
                containerStyle={{backgroundColor: 'transparent', borderWidth: 0, padding: 4, marginLeft: 0}}
                onPress={() => setBackupOptions(prev => ({...prev, customMaps: !prev.customMaps}))}
                title={'Custom Maps'}
                titleStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}
              />
              <Text style={{fontSize: SMALL_TEXT_SIZE, color: DARKGREY, marginTop: 4, marginBottom: 4}}>
                Note: User settings (Mapbox token, credentials) are not included in backups.
              </Text>
            </View>
          )}
        </View>
      ) : renderBackingUpView()}
    </>
  );
};

export default SaveAndExportModalContent;
