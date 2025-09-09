import React, {useRef} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import overlayStyles from './overlay.styles';
import {SMALL_SCREEN} from '../../styles.constants';
import {useWindowSize} from '../useWindowSize';


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
      animationType={'fade'}
      fullScreen={SMALL_SCREEN}
      isVisible={isVisible}
      onBackdropPress={onTouchOutside}
      overlayStyle={getResponsiveOverlayStyle()}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[overlayStyles.titleContainer, titleContainer]}>
        <Text style={[overlayStyles.titleText, overlayTitleText]}>{title}</Text>
      </View>
      <ScrollView
        onContentSizeChange={() => scrollView.current.scrollToEnd({animated: true})}
        ref={scrollView}
      >
        <View style={overlayStyles.overlayContent}>
          {children}
        </View>
      </ScrollView>
      <View style={overlayStyles.buttonContainer}>
        {(showCancelButton || false) && (
          <Button
            containerStyle={{padding: 5}}
            onPress={closeModal}
            title={closeTitle || 'Close'}
            type={'outline'}
          />
        )}
        {(showMiddleButton || false) && (
          <Button
            containerStyle={{padding: 5}}
            onPress={middleButtonPress}
            title={middleButtonTitle || 'Close'}
            type={'outline'}
          />
        )}
        {showConfirmButton && (
          <Button
            containerStyle={{padding: 5}}
            disabled={isConfirmDisabled}
            onPress={onConfirmPress}
            title={confirmText || 'Ok'}
            titleStyle={confirmTitleStyle}
          />
        )}
      </View>
    </Overlay>
  );
};

export default StatusDialogBox;
