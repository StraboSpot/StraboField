import React from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {useSelector} from 'react-redux';

import LottieAnimations from '../../../utils/animations/LottieAnimations';

const SaveAndExportModalContent = ({
                                     backingUpStatus,
                                     backupAction,
                                     backupFileName,
                                     isFileNameError,
                                     setBackupFileName,
                                     setIsFileNameError,
                                   }) => {
  const statusMessages = useSelector(state => state.home.statusMessages);

  const backupActionTitle = backupAction === 'export' ? 'project'
    : backupAction === 'exportTags' ? 'Tags'
      : 'Geologic Units';
  const fileExtension = backupAction === 'export' ? '.zip' : '.json';
  const fileName = backupFileName.replace(/\s/g, '_');

  const renderBackingUpView = () => (
    <View style={{padding: 20, alignItems: 'center'}}>
      <LottieAnimations
        doesLoop={backingUpStatus === 'inProgress'}
        show
        type={backingUpStatus === 'inProgress' ? 'loadingFile'
          : backingUpStatus === 'complete' ? 'complete' : 'error'}
      />
      <Text style={{marginTop: 12, textAlign: 'center', color: '#444'}}>
        {statusMessages.join('\n')}
      </Text>
    </View>
  );

  const validateFileName = (filenameChanged) => {
    const regexp = /^[a-zA-Z0-9-_]*$/; // Check for alphanumeric characters, a dash or underscore (allow empty)
    const fileNameWithUnderscores = filenameChanged.replace(/\s/g, '_');
    if (fileNameWithUnderscores.search(regexp) === -1) setIsFileNameError(true);
    else setIsFileNameError(false);
    setBackupFileName(filenameChanged);
  };

  return (
    <>
      {backingUpStatus === '' ? (
        <View style={{padding: 16}}>
          {/* Instruction Text */}
          <Text style={{fontSize: 16, marginBottom: 12, color: '#444'}}>
            {backupAction === 'save' ? 'All datasets will be saved locally, along with any images and custom maps.'
              : 'Your ' + backupActionTitle + ' will be '
              + (Platform.OS === 'ios' ? 'saved as a ' + fileExtension + ' file into the StraboField/Distribution folder.'
                + '\n\nMove it out of StraboField using the iOS Files app.'
                : 'exported as a ' + fileExtension + ' file into the Downloads\\StraboSpot2\\Backups folder.')
              + '\n\nFile will be saved as:'}
          </Text>

          {/* File Name Input */}
          <Text style={{fontWeight: '600', marginBottom: 6}}>File Name</Text>
          <TextInput
            onChangeText={validateFileName}
            style={[
              {
                borderWidth: 1,
                borderColor: isFileNameError ? 'red' : '#ccc',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                fontSize: 15,
                backgroundColor: '#fafafa',
              },
            ]}
            value={fileName}
          />
          {isFileNameError && (
            <Text style={{color: 'red', marginBottom: 8, fontSize: 13}}>
              File Name Error! Only letters, numbers, dashes, or underscores allowed.
            </Text>
          )}
          <Text style={{fontSize: 12, color: '#666', marginBottom: 16}}>
            *File names cannot contain spaces or special characters. Do not include a file extension.
          </Text>
        </View>
      ) : renderBackingUpView()}
    </>
  );
};

export default SaveAndExportModalContent;
