import React from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {ImagesList, useImages} from '.';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {useSpots} from '../spots';
import {editedSpotProperties} from '../spots/spots.slice';

const ImagesInSpot = ({isReadOnly, saveImages}) => {

  const dispatch = useDispatch();
  const images = useSelector(state => state.spot.selectedSpot.properties?.images) || [];
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {deleteImageFromSpot} = useImages();
  const {getSpotByImageId} = useSpots();

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

  return (
    <ImagesList
      deleteImage={deleteImage}
      images={images}
      isReadOnly={isReadOnly}
      saveImages={saveImages}
      saveUpdatedImage={saveUpdatedImage}
    />
  );
};

export default ImagesInSpot;
