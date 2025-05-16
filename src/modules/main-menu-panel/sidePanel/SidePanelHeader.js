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
            name={'arrow-back'}
            type={'ionicon'}
            iconStyle={projectStyles.buttons}
            size={20}
          />
        }
        title={title}
        type={'clear'}
        titleStyle={projectStyles.buttonText}
        onPress={backButton}
      />
      <View style={projectStyles.headerTextContainer}>
        <Text style={projectStyles.headerText}>{headerTitle}</Text>
      </View>
    </View>
  );
};

export default SidePanelHeader;
