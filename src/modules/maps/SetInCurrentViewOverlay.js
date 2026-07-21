import React from 'react';
import {View} from 'react-native';

import {SET_IN_CURRENT_VIEW_BUTTON_ICONS, SET_IN_CURRENT_VIEW_BUTTONS} from './maps.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import IconButton from '../../shared/ui/buttons/IconButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

// Modal to prompt the user to select a geometry if no geometry has been set
const SetInCurrentViewOverlay = ({
                                   createDefaultGeomContinued,
                                   setShowSetInCurrentViewModal,
                                   showSetInCurrentViewModal,
                                 }) => {
  /* Logic Helpers */

  const updateDefaultGeomType = (geomType) => {
    setShowSetInCurrentViewModal(false);
    createDefaultGeomContinued(geomType);
  };

  /* View */

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
        {SET_IN_CURRENT_VIEW_BUTTONS.map(button =>
          <ClearButton
            icon={
              <IconButton
                onPress={() => updateDefaultGeomType(button)}
                source={SET_IN_CURRENT_VIEW_BUTTON_ICONS[button]}
                style={{paddingRight: 10}}
              />
            }
            key={button}
            onPress={() => updateDefaultGeomType(button)}
            title={button}
          />,
        )}
      </View>
    </ModalWrapper>
  );
};

export default SetInCurrentViewOverlay;
