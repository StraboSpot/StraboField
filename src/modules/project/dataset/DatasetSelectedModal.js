import React from 'react';
import {Text, View} from 'react-native';

import StandardModal from '../../../shared/ui/StandardModal';
import overlayStyles from '../../home/overlays/overlay.styles';
import useProject from '../useProject';

const DatasetSelectedModal = ({closeModal, dataset}) => {

  const {makeDatasetCurrent} = useProject();

  const handleSetCurrentDatasetPressed = () => {
    makeDatasetCurrent(dataset.id);
    closeModal();
  };

  return (
    <StandardModal
      dialogTitleStyle={{backgroundColor: 'green'}}
      visible={true}
      footerButtonsVisible={true}
      dialogTitle={'Set as Target Dataset?'}
      rightButtonText={'Yes'}
      leftButtonText={'No'}
      onPress={handleSetCurrentDatasetPressed}
      closeModal={closeModal}
    >
      <View>
        <Text style={overlayStyles.statusMessageText}>
          By selecting &quot;Yes&quot; any new Spots will be saved into:
        </Text>
        <Text style={{...overlayStyles.statusMessageText, fontWeight: 'bold'}}>{dataset.name}</Text>
      </View>
    </StandardModal>
  );
};

export default DatasetSelectedModal;
