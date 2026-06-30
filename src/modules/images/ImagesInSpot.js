import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ImageModal, ImagePropertiesModal, ImagesList, useImages} from '.';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import SketchModal from '../sketch/SketchModal';
import {useSpots} from '../spots';
import {editedSpotProperties} from '../spots/spots.slice';

const ImagesInSpot = ({isReadOnly, onOpenImage, onOpenImageProperties, onPressEmpty, saveImages}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const images = useSelector(state => state.spot.selectedSpot.properties?.images) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {deleteImageFromSpot} = useImages();
  const {getSpotByImageId} = useSpots();

  /* Local State */

  const [imageToView, setImageToView] = useState({});
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);
  const [sketchImage, setSketchImage] = useState({});

  /* Event Handlers */

  const handleCloseImageModal = (isVisible) => {
    setIsImageModalVisible(isVisible);
  };

  const handleOpenImage = (image) => {
    if (onOpenImage) onOpenImage(image);
    else {
      setImageToView(image);
      setIsImageModalVisible(true);
    }
  };

  // Opening properties straight from an image card edits the image without first showing the image
  // viewer, so the properties modal renders on its own here rather than nested inside the image modal.
  const handleOpenImageProperties = (image) => {
    if (onOpenImageProperties) onOpenImageProperties(image);
    else {
      setImageToView(image);
      setIsImagePropertiesModalVisible(true);
    }
  };

  /* Event Handlers */

  const handleOpenSketch = (image) => {
    setIsImageModalVisible(false);
    setSketchImage(image);
    setIsSketchModalVisible(true);
  };

  /* Logic Helpers */

  const deleteImage = async (image) => {
    const isImageDeleted = await deleteImageFromSpot(image.id, getSpotByImageId(image.id));
    return isImageDeleted;
  };

  const saveUpdatedImage = (updatedImage) => {
    const imagesFiltered = images.filter(i => i.id !== updatedImage.id);
    const updatedImages = [...imagesFiltered, updatedImage];
    dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot?.properties?.id]));
    dispatch(editedSpotProperties({field: 'images', value: updatedImages}));
  };

  /* View */

  return (
    <>
      <ImagesList
        deleteImage={deleteImage}
        images={images}
        isReadOnly={isReadOnly}
        onOpenImage={handleOpenImage}
        onOpenImageProperties={handleOpenImageProperties}
        onPressEmpty={onPressEmpty}
      />

      {/* Modals */}
      {!onOpenImage && (
        <ImageModal
          deleteImage={deleteImage}
          image={imageToView}
          isReadOnly={isReadOnly}
          isVisible={isImageModalVisible}
          onOpenSketch={handleOpenSketch}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
          setIsImageModalVisible={handleCloseImageModal}
        />
      )}
      {isImagePropertiesModalVisible && (
        <ImagePropertiesModal
          closeModal={() => setIsImagePropertiesModalVisible(false)}
          image={imageToView}
          isReadOnly={isReadOnly}
          isVisible={isImagePropertiesModalVisible}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
        />
      )}
      {isSketchModalVisible && (
        <SketchModal
          image={sketchImage}
          saveImages={saveImages}
          setIsSketchModalVisible={setIsSketchModalVisible}
        />
      )}
    </>
  );
};

export default ImagesInSpot;
