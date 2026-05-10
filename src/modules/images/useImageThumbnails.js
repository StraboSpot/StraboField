import {useEffect, useState} from 'react';
import {Platform} from 'react-native';

import {getImageThumbnailURI, getLocalImageURI} from './imageURIs.helpers';
import useImageSize from './useImageSize';
import useDevice from '../../services/device/useDevice';
import {isEmpty} from '../../shared/helpers';

const useImageThumbnails = ({images} = {}) => {
  /* Data Hooks */

  const {doesDeviceDirExist} = useDevice();
  const {resizeImageForThumbnail} = useImageSize();

  /* Local State */

  const [areImageThumbnailsLoading, setAreImageThumbnailsLoading] = useState({});
  const [imageThumbnailURIs, setImageThumbnailURIs] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('UE ImageThumbnail []');
    if (!isEmpty(images)) loadImageThumbnailURIs().catch(err => console.error(err));
  }, [images]);

  /* Internal Functions */

  const loadImageThumbnailURIs = async () => {
    try {
      console.log('Getting Image URI Thumbnails for Images:', images);
      setAreImageThumbnailsLoading(Object.assign({}, ...images.map(image => ({[image.id]: true}))));
      const gotImageThumbnailURIs = await getImageThumbnailURIs(images);
      console.log('Got Image Thumbnail URIs:', gotImageThumbnailURIs);
      setAreImageThumbnailsLoading(Object.assign({},
        ...Object.keys(gotImageThumbnailURIs).map(key => ({[key]: !isEmpty(gotImageThumbnailURIs[key])}))));
      setImageThumbnailURIs(gotImageThumbnailURIs);
    }
    catch (err) {
      console.error('Error getting image thumbnail URIs', err);
      setAreImageThumbnailsLoading(Object.assign({}, ...images.map(image => ({[image.id]: false}))));
    }
  };

  /* Exported Functions */

  const getImageThumbnailURIs = async (imagesToProcess) => {
    try {
      let thumbnailURIs = {};
      await Promise.all(imagesToProcess.map(async (image) => {
        if (Platform.OS === 'web') {
          thumbnailURIs = {...thumbnailURIs, [image.id]: getImageThumbnailURI(image.id)};
        }
        else {
          const imageUri = getLocalImageURI(image.id);
          const exists = await doesDeviceDirExist(imageUri);
          if (exists) {
            const resizedImage = await resizeImageForThumbnail(imageUri);
            thumbnailURIs = {...thumbnailURIs, [image.id]: resizedImage.uri};
          }
          else thumbnailURIs = {...thumbnailURIs, [image.id]: undefined};
        }
      }));
      return thumbnailURIs;
    }
    catch (err) {
      console.error('Error creating thumbnails', err);
    }
  };

  return {
    areImageThumbnailsLoading,
    getImageThumbnailURIs,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  };
};

export default useImageThumbnails;
