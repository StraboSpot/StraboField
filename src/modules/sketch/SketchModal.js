import React from 'react';

import Sketch from './Sketch';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const SketchModal = ({image, saveImages, setIsSketchModalVisible}) => {
  return (
    <ModalWrapper
      closeModal={() => setIsSketchModalVisible(false)}
      fullscreen
      headerTitle={'Sketch'}
      scrollEnabled={false}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <Sketch image={image} saveImages={saveImages} setIsSketchModalVisible={setIsSketchModalVisible}/>
    </ModalWrapper>
  );
};

export default SketchModal;
