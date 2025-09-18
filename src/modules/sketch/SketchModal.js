import React from 'react';

import {Overlay} from '@rn-vui/base';

import Sketch from './Sketch';

const SketchModal = ({image, saveImages, setIsSketchModalVisible}) => {
  return (
    <Overlay
      fullScreen
      supportedOrientations={['portrait', 'landscape']}
    >
      <Sketch image={image} saveImages={saveImages} setIsSketchModalVisible={setIsSketchModalVisible}/>
    </Overlay>
  );
};

export default SketchModal;
