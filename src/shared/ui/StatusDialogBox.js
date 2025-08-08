import React, {useRef} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import overlayStyles from '../../modules/home/overlays/overlay.styles';
import {SMALL_SCREEN} from '../styles.constants';
import {useWindowSize} from './useWindowSize';


const StatusDialogBox = ({
                           children,
                           closeModal,
                           closeTitle,
                           confirmText,
                           confirmTitleStyle,
                           isVisible,
                           onConfirmPress,
                           onTouchOutside,
                           overlayTitleText,
                           showCancelButton,
                           showConfirmButton,
                           showMiddleButton,
                           title,
                           middleButtonTitle,
                           titleContainer,
                           middleButtonPress,
                           isConfirmDisabled,
                         }) => {
  const scrollView = useRef();

  const {height, width} = useWindowSize();

  const getResponsiveOverlayStyle = () => {
    if (width < 600) {
      return overlayStyles.overlayContainerFullScreen;
    }
    return {
      ...overlayStyles.overlayContainer,
      maxHeight: height * 0.9,
    };
  };

  return (
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      animationType={'fade'}
      isVisible={isVisible}
      fullScreen={SMALL_SCREEN}
      onBackdropPress={onTouchOutside}
      overlayStyle={getResponsiveOverlayStyle()}
    >
      <View style={[overlayStyles.titleContainer, titleContainer]}>
        <Text style={[overlayStyles.titleText, overlayTitleText]}>{title}</Text>
      </View>
      <ScrollView
        ref={scrollView}
        onContentSizeChange={() => scrollView.current.scrollToEnd({animated: true})}
      >
        <View style={overlayStyles.overlayContent}>
          {children}
        </View>
      </ScrollView>
      <View style={overlayStyles.buttonContainer}>
        {(showCancelButton || false) && (
          <Button
            title={closeTitle || 'Close'}
            type={'outline'}
            onPress={closeModal}
            containerStyle={{padding: 5}}
          />
        )}
        {(showMiddleButton || false) && (
          <Button
            title={middleButtonTitle || 'Close'}
            type={'outline'}
            onPress={middleButtonPress}
            containerStyle={{padding: 5}}
          />
        )}
        {showConfirmButton && (
          <Button
            disabled={isConfirmDisabled}
            title={confirmText || 'Ok'}
            titleStyle={confirmTitleStyle}
            onPress={onConfirmPress}
            containerStyle={{padding: 5}}
          />
        )}
      </View>
    </Overlay>
  );
};

export default StatusDialogBox;
