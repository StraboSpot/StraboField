import {Image, Platform} from 'react-native';

import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useDispatch, useSelector} from 'react-redux';

import {getLocalImageURI} from './imageURIs.helpers';
import useDevice from '../../services/device/useDevice';
import {TEMP_IMAGES_DOWNSIZED_DIRECTORY} from '../../services/files/directories.constants';
import {setCurrentImageBasemap} from '../maps/maps.slice';
import {editedSpotImage} from '../spots/spots.slice';

const IMAGE_MAX_THUMBNAIL_SIZE = 200;
const IMAGE_MAX_UPLOAD_SIZE = 2000;
const IMAGE_MAX_LOCAL_SIZE = 4096;

const useImageSize = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);

  const {doesDeviceDirExist, makeDirectory} = useDevice();

  /* Exported Functions */

  const getImageHeightAndWidth = (imageURI) => {
    return new Promise((resolve, reject) => {
      Image.getSize(imageURI, (imageWidth, imageHeight) => {
        resolve({height: imageHeight, width: imageWidth});
      }, (err) => {
        console.log('Error getting size of image:', err.message);
        reject(err);
      });
    });
  };

  const resizeImageForDevice = async (imageData) => {
    let imgHeight = imageData.height;
    let imgWidth = imageData.width;
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    if (!imgHeight || !imgWidth) ({imgHeight, imgWidth} = await getImageHeightAndWidth(tempImageURI));
    const createResizedImageProps = (imgHeight > IMAGE_MAX_LOCAL_SIZE || imgWidth > IMAGE_MAX_LOCAL_SIZE)
      ? [tempImageURI, IMAGE_MAX_LOCAL_SIZE, IMAGE_MAX_LOCAL_SIZE, 'JPEG', 100, 0]
      : [tempImageURI, imgWidth, imgHeight, 'JPEG', 100, 0];
    return ImageResizer.createResizedImage(...createResizedImageProps);
  };

  const resizeImageForThumbnail = async (imageUri) => {
    const createResizedImageProps = [imageUri, IMAGE_MAX_THUMBNAIL_SIZE, IMAGE_MAX_THUMBNAIL_SIZE, 'JPEG', 100, 0];
    return await ImageResizer.createResizedImage(...createResizedImageProps);
  };

  const resizeImageForUpload = async (imageProps) => {
    try {
      console.log('Resizing Image', imageProps?.id, '...');
      let imageHeight = imageProps?.height;
      let imageWidth = imageProps?.width;

      if (!imageWidth || !imageHeight) ({imageWidth, imageHeight} = await getImageHeightAndWidth(imageProps.uri));

      if (imageWidth > IMAGE_MAX_UPLOAD_SIZE || imageHeight > IMAGE_MAX_UPLOAD_SIZE) {
        if (imageWidth > imageHeight && imageWidth > IMAGE_MAX_UPLOAD_SIZE) {
          imageHeight = IMAGE_MAX_UPLOAD_SIZE * imageHeight / imageWidth;
          imageWidth = IMAGE_MAX_UPLOAD_SIZE;
        }
        else if (imageHeight > IMAGE_MAX_UPLOAD_SIZE) {
          imageWidth = IMAGE_MAX_UPLOAD_SIZE * imageWidth / imageHeight;
          imageHeight = IMAGE_MAX_UPLOAD_SIZE;
        }

        await makeDirectory(TEMP_IMAGES_DOWNSIZED_DIRECTORY);
        const createResizedImageProps = [imageProps.uri, imageWidth, imageHeight, 'JPEG', 100, 0, TEMP_IMAGES_DOWNSIZED_DIRECTORY];
        return await ImageResizer.createResizedImage(...createResizedImageProps);
      }
      else return imageProps;
    }
    catch (err) {
      console.error('Error Resizing Image.', err);
      throw Error('Error Resizing Image.', err);
    }
  };

  const setImageHeightAndWidth = async (image) => {
    const imageURI = getLocalImageURI(image.id);
    if (imageURI) {
      const isValidImageURI = await doesDeviceDirExist(imageURI);
      if (isValidImageURI) {
        const imageSize = await getImageHeightAndWidth(imageURI);
        const updatedImage = {...image, ...imageSize};
        const spot = dispatch(editedSpotImage(updatedImage));
        console.log(spot);
        if (currentImageBasemap.id === updatedImage.id) dispatch(setCurrentImageBasemap(updatedImage));
      }
    }
    else console.error('Error setting image height and width');
  };

  return {
    getImageHeightAndWidth,
    resizeImageForDevice,
    resizeImageForThumbnail,
    resizeImageForUpload,
    setImageHeightAndWidth,
  };
};

export default useImageSize;
