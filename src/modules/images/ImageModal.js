import React from 'react';

import {Overlay} from '@rn-vui/base';

import {ImageInfo} from '.';

const ImageModal = ({
                      deleteImage,
                      image,
                      isReadOnly,
                      saveImages,
                      saveUpdatedImage,
                      setImageToView,
                      setIsImageModalVisible,
                    }) => {
  return (
    <Overlay
      fullScreen
      supportedOrientations={['portrait', 'landscape']}
    >
      <ImageInfo
        deleteImage={deleteImage}
        image={image}
        isReadOnly={isReadOnly}
        saveImages={saveImages}
        saveUpdatedImage={saveUpdatedImage}
        setImageToView={setImageToView}
        setIsImageModalVisible={setIsImageModalVisible}
      />
    </Overlay>
  );
};

export default ImageModal;
