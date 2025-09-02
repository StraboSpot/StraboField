import React from 'react';
import {Text, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';

import sidePanelStyles from './sidePanel.styles';
import projectStyles from '../../project/project.styles';

const SidePanelHeader = ({
                           backButton,
                           headerTitle,
                           title,
                         }) => {
  return (
    <View style={sidePanelStyles.sidePanelHeaderContainer}>
      <Button
        icon={
          <Icon
            iconStyle={projectStyles.buttons}
            name={'arrow-back'}
            size={20}
            type={'ionicon'}
          />
        }
        onPress={backButton}
        title={title}
        titleStyle={projectStyles.buttonText}
        type={'clear'}
      />
      <View style={projectStyles.headerTextContainer}>
        <Text style={projectStyles.headerText}>{headerTitle}</Text>
      </View>
    </View>
  );
};

export default SidePanelHeader;
