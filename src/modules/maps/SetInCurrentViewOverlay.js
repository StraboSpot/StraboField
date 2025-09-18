import React from 'react';
import {Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';

import IconButton from '../../shared/ui/buttons/IconButton';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

// Modal to prompt the user to select a geometry if no geometry has been set
const SetInCurrentViewOverlay = ({
                                   createDefaultGeomContinued,
                                   setShowSetInCurrentViewModal,
                                   showSetInCurrentViewModal,
                                 }) => {

  const buttons = ['Point', 'LineString', 'Polygon'];

  const buttonIcon = (button) => {
    return button === 'LineString' ? require('../../assets/icons/LineButton.png')
      : button === 'Point' ? require('../../assets/icons/PointButton.png')
        : button === 'Polygon' ? require('../../assets/icons/PolygonButton.png')
          : null;
  };

  const updateDefaultGeomType = (geomType) => {
    setShowSetInCurrentViewModal(false);
    createDefaultGeomContinued(geomType);
  };

  return (
    <Overlay
      animationType={'slide'}
      isVisible={showSetInCurrentViewModal}
      onBackdropPress={() => setShowSetInCurrentViewModal(false)}
      overlayStyle={overlayStyles.overlayContainer}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={overlayStyles.titleText}>Select a Geometry Type</Text>
      </View>
      <View style={[overlayStyles.overlayContent, overlayStyles.selectGeometryTypeContent]}>
        {buttons.map(button =>
          <Button
            buttonStyle={overlayStyles.buttonText}
            icon={
              <IconButton
                onPress={() => updateDefaultGeomType(button)}
                source={buttonIcon(button)}
                style={{paddingRight: 15}}
              />
            }
            key={button}
            onPress={() => updateDefaultGeomType(button)}
            title={button}
            type={'clear'}
          />,
        )}
      </View>
    </Overlay>
  );
};

export default SetInCurrentViewOverlay;
