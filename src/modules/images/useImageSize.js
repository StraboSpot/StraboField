import {Image, Platform} from 'react-native';

import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useDispatch, useSelector} from 'react-redux';

import {getLocalImageURI} from './imageURIs.helpers';
import useDevice from '../../services/device/useDevice';
import {TEMP_IMAGES_DOWNSIZED_DIRECTORY} from '../../services/files/directories.constants';
import {setCurrentImageBasemap} from '../maps/maps.slice';
import {editedSpotImage} from '../spots/spots.slice';

const useImageSize = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);

  const {doesDeviceDirExist, makeDirectory} = useDevice();

  /* Exported Functions */

  const createThumbnail = async (imageUri) => {
    const createResizedImageProps = [imageUri, 200, 200, 'JPEG', 100, 0];
    return await ImageResizer.createResizedImage(...createResizedImageProps);
  };

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

  const resizeImageForUpload = async (imageProps) => {
    try {
      console.log('Resizing Image', imageProps?.id, '...');
      let imageHeight = imageProps?.height;
      let imageWidth = imageProps?.width;

      if (!imageWidth || !imageHeight) ({imageWidth, imageHeight} = await getImageHeightAndWidth(imageProps.uri));

      if (imageWidth > 2000 || imageHeight > 2000) {
        const max_size = 2000;
        if (imageWidth > imageHeight && imageWidth > max_size) {
          imageHeight = max_size * imageHeight / imageWidth;
          imageWidth = max_size;
        }
        else if (imageHeight > max_size) {
          imageWidth = max_size * imageWidth / imageHeight;
          imageHeight = max_size;
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

  const resizeImageIfNecessary = async (imageData) => {
    let imgHeight = imageData.height;
    let imgWidth = imageData.width;
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    if (!imgHeight || !imgWidth) ({imgHeight, imgWidth} = await getImageHeightAndWidth(tempImageURI));
    const createResizedImageProps = (imgHeight > 4096 || imgWidth > 4096) ? [tempImageURI, 4096, 4096, 'JPEG', 100, 0]
      : [tempImageURI, imgWidth, imgHeight, 'JPEG', 100, 0];
    return ImageResizer.createResizedImage(...createResizedImageProps);
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
    createThumbnail,
    getImageHeightAndWidth,
    resizeImageForUpload,
    resizeImageIfNecessary,
    setImageHeightAndWidth,
  };
};

export default useImageSize;
