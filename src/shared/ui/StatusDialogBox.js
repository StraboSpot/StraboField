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
                           onConfirmPress,
                           onTouchOutside,
                           overlayTitleText,
                           showCancelButton,
                           showConfirmButton,
                           title,
                           titleContainer,
                           isVisible,
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
            type={'clear'}
            onPress={closeModal}
          />
        )}
        {showConfirmButton && (
          <Button
            title={confirmText || 'Ok'}
            titleStyle={confirmTitleStyle}
            type={'clear'}
            onPress={onConfirmPress}
          />
        )}
      </View>
    </Overlay>
  );
};

export default StatusDialogBox;
