import React from 'react';
import {View} from 'react-native';

import buttonsStyles from './buttons.styles';
import ClearButton from './ClearButton';

const SaveAndCancelButtons = ({cancel, save, getIsDisabled, title}) => {
  return (
    <View style={buttonsStyles.navButtonsContainer}>
      {cancel && <ClearButton onPress={cancel} title={'Cancel'}/>}
      {save && <ClearButton disabled={getIsDisabled} onPress={save} title={title || 'Save'}/>}
    </View>
  );
};

export default SaveAndCancelButtons;
