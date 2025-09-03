import React from 'react';
import {Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import overlayStyles from '../../modules/home/overlays/overlay.styles';

const DeleteConformationDialogBox = ({
                                       cancel,
                                       children,
                                       deleteOverlay,
                                       isVisible,
                                       title,
                                     }) => {
  return (
    <Overlay
      animationType={'fade'}
      backdropStyle={{backgroundColor: 'transparent'}}
      isVisible={isVisible}
      overlayStyle={overlayStyles.overlayContainer}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={[overlayStyles.titleText, overlayStyles.importantText]}>{title}</Text>
      </View>
      <View style={overlayStyles.overlayContent}>
        {children}
      </View>
      <View style={overlayStyles.buttonContainer}>
        <Button
          onPress={deleteOverlay}
          title={'Delete'}
          titleStyle={overlayStyles.buttonText}
          type={'clear'}
        />
        <Button
          onPress={cancel}
          title={'Cancel'}
          titleStyle={overlayStyles.buttonText}
          type={'Cancel'}
        />
      </View>
    </Overlay>
  );
};

export default DeleteConformationDialogBox;
