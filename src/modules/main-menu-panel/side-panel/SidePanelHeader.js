import React from 'react';
import {Text, View} from 'react-native';

import sidePanelStyles from './sidePanel.styles';
import ClearButton from '../../../shared/ui/buttons/ClearButton';
import projectStyles from '../../project/project.styles';

const SidePanelHeader = ({
                           backButton,
                           headerTitle,
                           title,
                         }) => {
  return (
    <View style={sidePanelStyles.sidePanelHeaderContainer}>
      <ClearButton
        icon={{
          iconStyle: projectStyles.buttons,
          name: 'arrow-back',
          size: 20,
          type: 'ionicon',
        }}
        onPress={backButton}
        title={title}
      />
      <View style={projectStyles.headerTextContainer}>
        <Text style={projectStyles.headerText}>{headerTitle}</Text>
      </View>
    </View>
  );
};

export default SidePanelHeader;
