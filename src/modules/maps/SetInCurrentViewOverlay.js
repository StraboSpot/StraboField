import React from 'react';
import {View} from 'react-native';

import {Button} from '@rn-vui/base';

import IconButton from '../../shared/ui/buttons/IconButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
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
    <ModalWrapper
      closeModal={() => setShowSetInCurrentViewModal(false)}
      headerTitle={'Set Geometry Type'}
      isVisible={showSetInCurrentViewModal}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <View style={overlayStyles.selectGeometryTypeContent}>
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
    </ModalWrapper>
  );
};

export default SetInCurrentViewOverlay;
