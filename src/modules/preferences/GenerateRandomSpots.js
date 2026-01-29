import React, {useState} from 'react';

import {Input} from '@rn-vui/base';
import {useToast} from 'react-native-toast-notifications';

import styles from './preferences.styles';
import * as themes from '../../shared/styles.constants';
import {PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import formStyles from '../form/form.styles';
import useMapLocation from '../maps/useMapLocation';

const GenerateRandomSpots = () => {
  const toast = useToast();

  const [numRandomSpots, setNumRandomSpots] = useState(100);
  const [isSpotGeneratorVisible, setIsSpotGeneratorVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const {generateRandomsSpotsAroundCurrentLocation} = useMapLocation();

  const generateRandomSpots = async () => {
    const numRandomSpotsInt = parseInt(numRandomSpots, 10);
    if (numRandomSpotsInt) {
      setNumRandomSpots(numRandomSpotsInt);
      setLoading(true);
      await generateRandomsSpotsAroundCurrentLocation(numRandomSpotsInt);
      setLoading(false);
      toast.show(`${numRandomSpotsInt} Random Spots Generated`, {});
    }
    else alert('Error Generating Random Spots', 'The number of Spots must be an integer.');
  };

  return (
    <>
      <OutlineButton
        onPress={() => setIsSpotGeneratorVisible(!isSpotGeneratorVisible)}
        title={'Generate Random Spots...'}
      />

      {isSpotGeneratorVisible && (
        <ModalWrapper
          actionTitle={'Generate'}
          closeModal={() => setIsSpotGeneratorVisible(false)}
          headerTitle={'Generate Random Spots'}
          isLoading={loading}
          isVisible={isSpotGeneratorVisible}
          onActionPressed={generateRandomSpots}
          overlayStyleOverride={{height: 'auto'}}
          showCancelButton={false}
          showCloseButton
        >
          <Input
            containerStyle={styles.inputContainer}
            defaultValue={numRandomSpots}
            inputStyle={formStyles.fieldValue}
            label={'Number of Spots'}
            labelStyle={{color: PRIMARY_TEXT_COLOR}}
            onChangeText={value => setNumRandomSpots(value || 100)}
            placeholder={String(numRandomSpots) + ' spots is set as a default'}
            placeholderTextColor={themes.MEDIUMGREY}
          />
        </ModalWrapper>
      )}
    </>

  );
};

export default GenerateRandomSpots;



