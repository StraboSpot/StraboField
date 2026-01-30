import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import ProgressBar from 'react-native-progress/Bar';

import {toNumberFixedValue} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';


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
    <ModalWrapper
      actionTitle={'OK'}
      headerTitle={'StraboMicro Project'}
      isVisible={showLoadingBar || isError || showComplete}
      onActionPressed={closeStatusOverlay}
      overlayStyleOverride={{height: 'auto'}}
      showCancelButton={false}
    >
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
    </ModalWrapper>
  );
};

export default MicroProjectsStatusOverlay;
