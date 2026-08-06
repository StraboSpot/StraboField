import React from 'react';
import {Text} from 'react-native';

import styles from './form.styles';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {LABELS_WITH_ABBREVIATIONS} from '../petrology/minerals.constants';

// Displays a field's hint. fieldInfo is {label, info}; null or undefined hides the modal.
const FieldInfoModal = ({fieldInfo, onClose}) => {
  /* Logic Helpers */

  const getInfoText = () => {
    if (fieldInfo.label !== 'Mineral Name Abbreviation') return fieldInfo.info;
    const abbreviations = Object.entries(LABELS_WITH_ABBREVIATIONS).map(([key, value]) => key + ': ' + value);
    return fieldInfo.info + '\n\n' + abbreviations.join('\n');
  };

  /* View */

  if (!fieldInfo) return null;

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      closeModal={onClose}
      headerTitle={fieldInfo.label}
      isContentSized
      isVisible
      onActionPressed={onClose}
      onBackdropPress={onClose}
      overlayStyleOverride={{height: 'auto'}}
      showActionButton
      showCancelButton={false}
      showCloseButton
    >
      <Text style={styles.fieldInfoText}>{getInfoText()}</Text>
    </ModalWrapper>
  );
};

export default FieldInfoModal;
