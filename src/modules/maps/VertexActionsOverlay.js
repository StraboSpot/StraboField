import React from 'react';
import {View} from 'react-native';

import ClearButton from '../../shared/ui/buttons/ClearButton';
import IconButton from '../../shared/ui/buttons/IconButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

// Modal to prompt the user to select a geometry if no geometry has been set
const VertexActionsOverlay = ({
                                addNewVertex,
                                deleteSelectedVertex,
                                isShowVertexActionsModal,
                                setIsShowVertexActionsModal,
                                splitLine,
                                vertexActionValues,
                              }) => {

  const buttons = ['Add Vertex', 'Delete Vertex', 'Split Line'];

  const buttonIcon = (button) => {
    return button === 'Add Vertex' ? require('../../assets/icons/LineButton.png')
      : button === 'Delete Vertex' ? require('../../assets/icons/PointButton.png')
        : button === 'Split Line' ? require('../../assets/icons/PolygonButton.png')
          : null;
  };

  const handleActionPressed = (button) => {
    setIsShowVertexActionsModal(false);
    console.log('vertexActionValues', vertexActionValues);
    if (button === 'Add Vertex') {
      let {e, spotEditingCopy, spotToEdit} = vertexActionValues;
      addNewVertex(e, spotEditingCopy, spotToEdit);
    }
    else if (button === 'Delete Vertex') {
      let {spotEditingCopy, vertexSelected} = vertexActionValues;
      deleteSelectedVertex(spotEditingCopy, vertexSelected);
    }
    else if (button === 'Split Line') {
      let {e, spotEditingCopy, spotToEdit, vertexSelected} = vertexActionValues;
      splitLine(e, spotEditingCopy, spotToEdit, vertexSelected);
    }
  };

  return (
    <ModalWrapper
      closeModal={() => setIsShowVertexActionsModal(false)}
      headerTitle={'Select an Action'}
      isActionButtonVisible={false}
      isVisible={isShowVertexActionsModal}
      onActionPressed={() => handleActionPressed('Add Vertex')}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <View style={[overlayStyles.overlayContent, overlayStyles.selectGeometryTypeContent]}>
        {buttons.map((button) => {
            return (
              ((vertexActionValues.vertexSelected && button !== 'Add Vertex')
                || (!vertexActionValues.vertexSelected && button !== 'Delete Vertex')) && (
                <ClearButton
                  icon={
                    <IconButton
                      onPress={() => handleActionPressed(button)}
                      source={buttonIcon(button)}
                      style={{paddingRight: 15}}
                    />
                  }
                  key={button}
                  onPress={() => handleActionPressed(button)}
                  title={button}
                />
              )
            );
          },
        )}
      </View>
    </ModalWrapper>
  );
};

export default VertexActionsOverlay;
