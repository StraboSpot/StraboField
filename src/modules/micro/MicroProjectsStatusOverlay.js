import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {Button, Icon, Overlay} from '@rn-vui/base';
import ProgressBar from 'react-native-progress/Bar';

import {toNumberFixedValue} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import overlayStyles from '../home/overlays/overlay.styles';
import offlineMapsStyles from '../maps/offline-maps/offlineMaps.styles';


const MicroProjectsStatusOverlay = ({
                                      closeStatusOverlay,
                                      errorMessage,
                                      isError,
                                      isLoadingWave,
                                      percentDone,
                                      showComplete,
                                      showLoadingBar,
                                    }) => {
  return (
    <Overlay
      animationType={'slide'}
      backdropStyle={overlayStyles.backdropStyles}
      isVisible={showLoadingBar || isError || showComplete}
      onBackdropPress={closeStatusOverlay}
      overlayStyle={[overlayStyles.overlayContainer, offlineMapsStyles.saveModalContainer, {justifyContent: 'space-between'}]}
      supportedOrientations={['portrait', 'landscape']}
    >
      <Icon
        color={'darkgrey'}
        containerStyle={overlayStyles.closeButton}
        name={'close-outline'}
        onPress={closeStatusOverlay}
        size={20}
        type={'ionicon'}
      />
      <View>
        {!showComplete && !isError && (
          <Text style={overlayStyles.contentText}>Getting your StraboMicro Project...</Text>
        )}
        {showLoadingBar && (
          <View style={overlayStyles.overlayContent}>
            {isLoadingWave ? (
              <ActivityIndicator color={themes.BLACK} size={'large'}/>
            ) : (
              <View>
                <ProgressBar progress={percentDone} width={200}/>
                <Text style={overlayStyles.statusMessageText}>
                  {toNumberFixedValue(percentDone, 0)}
                </Text>
              </View>
            )}
          </View>
        )}
        {isError && (
          <View style={overlayStyles.overlayContent}>
            <Text style={overlayStyles.titleText}>Something Went Wrong!</Text>
            <Text style={overlayStyles.contentText}>{errorMessage}</Text>
          </View>
        )}
        {showComplete && (
          <View style={overlayStyles.overlayContent}>
            <Text style={overlayStyles.titleText}>Success!</Text>
            <Text style={overlayStyles.contentText}>
              Your StraboMicro Project has been successfully downloaded to this device.
            </Text>
          </View>
        )}
      </View>
      <Button
        containerStyle={{paddingBottom: 20, paddingHorizontal: 40}}
        onPress={closeStatusOverlay}
        title={'OK'}
      />
    </Overlay>
  );
};

export default MicroProjectsStatusOverlay;
