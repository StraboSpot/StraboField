import React from 'react';
import {View} from 'react-native';

import {VERTEX_ACTION_BUTTONS} from './maps.constants';
import {getVertexActionButtonIcon} from './maps.helpers';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import IconButton from '../../shared/ui/buttons/IconButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

// Modal to prompt the user to select a geometry if no geometry has been set
const VertexActionsOverlay = ({
                                addNewVertex,
                                deleteSelectedVertex,
                                extendLineFromEndpoint,
                                isShowVertexActionsModal,
                                setIsShowVertexActionsModal,
                                splitLine,
                                vertexActionValues,
                              }) => {
  /* Event Handlers */

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
    else if (button === 'Extend Line') {
      let {spotEditingCopy, vertexSelected} = vertexActionValues;
      extendLineFromEndpoint(spotEditingCopy, vertexSelected);
    }
  };

  const isButtonShown = (button) => {
    const {isEndpointVertex, spotEditingCopy, vertexSelected} = vertexActionValues;
    const lineCoordCount = spotEditingCopy?.geometry?.coordinates?.length ?? 0;
    // Extend only from an endpoint; no splitting at an endpoint; no deleting below a line's two-point minimum.
    if (button === 'Extend Line') return isEndpointVertex;
    if (button === 'Split Line' && isEndpointVertex) return false;
    if (button === 'Delete Vertex' && vertexSelected && lineCoordCount <= 2) return false;
    // Otherwise: vertex selected -> Delete/Split, no vertex -> Add/Split.
    return (vertexSelected && button !== 'Add Vertex')
      || (!vertexSelected && button !== 'Delete Vertex');
  };

  /* View */

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
        {VERTEX_ACTION_BUTTONS.map((button) => {
            return (
              isButtonShown(button) && (
                <ClearButton
                  icon={
                    <IconButton
                      onPress={() => handleActionPressed(button)}
                      source={getVertexActionButtonIcon(button)}
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
