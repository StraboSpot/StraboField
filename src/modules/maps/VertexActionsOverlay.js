import React from 'react';
import {Text, View} from 'react-native';

import {Button, Overlay} from 'react-native-elements';

import IconButton from '../../shared/ui/IconButton';
import overlayStyles from '../home/overlays/overlay.styles';

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
    <Overlay
      animationType={'slide'}
      overlayStyle={overlayStyles.overlayContainer}
      isVisible={isShowVertexActionsModal}
      onBackdropPress={() => {
      }}
    >
      <View style={overlayStyles.titleContainer}>
        <Text style={overlayStyles.titleText}>Select an Action</Text>
      </View>
      <View style={[overlayStyles.overlayContent, overlayStyles.selectGeometryTypeContent]}>
        {buttons.map((button) => {
            return (
              ((vertexActionValues.vertexSelected && button !== 'Add Vertex')
                || (!vertexActionValues.vertexSelected && button !== 'Delete Vertex')) && (
                <Button
                  icon={
                    <IconButton
                      style={{paddingRight: 15}}
                      source={buttonIcon(button)}
                      onPress={() => handleActionPressed(button)}
                    />
                  }
                  title={button}
                  buttonStyle={overlayStyles.buttonText}
                  type={'clear'}
                  onPress={() => handleActionPressed(button)}
                  key={button}
                />
              )
            );
          },
        )}
      </View>
    </Overlay>
  );
};

export default VertexActionsOverlay;
