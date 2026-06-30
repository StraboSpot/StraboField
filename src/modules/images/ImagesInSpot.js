import React, {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ImageModal, ImagePropertiesModal, ImagesList, useImages} from '.';
import {SMALL_SCREEN} from '../../shared/styles.constants';
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
  const [shouldOpenImageProperties, setShouldOpenImageProperties] = useState(false);
  const [sketchImage, setSketchImage] = useState({});

  /* Event Handlers */

  const handleCloseImageModal = (isVisible) => {
    setIsImageModalVisible(isVisible);
    if (!isVisible) setShouldOpenImageProperties(false);
  };

  const handleOpenImage = (image) => {
    if (onOpenImage) onOpenImage(image);
    else {
      setShouldOpenImageProperties(false);
      setImageToView(image);
      setIsImageModalVisible(true);
    }
  };

  // Opening properties from an image card: on small screens show only the standalone properties modal
  // so the viewer isn't a throwaway host that flashes before the fullscreen properties modal covers
  // it. On larger screens open the viewer and let it auto-open its nested properties modal (which
  // stacks reliably over the viewer's modal on iOS, where sibling modals don't).
  const handleOpenImageProperties = (image) => {
    if (onOpenImageProperties) onOpenImageProperties(image);
    else {
      setImageToView(image);
      if (SMALL_SCREEN) setIsImagePropertiesModalVisible(true);
      else {
        setShouldOpenImageProperties(true);
        setIsImageModalVisible(true);
      }
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
          shouldOpenProperties={shouldOpenImageProperties}
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
