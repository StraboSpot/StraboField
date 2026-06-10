import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ImageModal, ImagesList, useImages} from '.';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import SketchModal from '../sketch/SketchModal';
import {useSpots} from '../spots';
import {editedSpotProperties} from '../spots/spots.slice';

const ImagesInSpot = ({isReadOnly, onOpenImage, onPressEmpty, saveImages}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const images = useSelector(state => state.spot.selectedSpot.properties?.images) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {deleteImageFromSpot} = useImages();
  const {getSpotByImageId} = useSpots();

  /* Local State */

  const [imageToView, setImageToView] = useState({});
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);
  const [sketchImage, setSketchImage] = useState({});

  /* Event Handlers */

  const handleOpenImage = (image) => {
    if (onOpenImage) onOpenImage(image);
    else {
      setImageToView(image);
      setIsImageModalVisible(true);
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
          setIsImageModalVisible={setIsImageModalVisible}
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
