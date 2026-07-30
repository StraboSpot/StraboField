import {Image, Platform} from 'react-native';

import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useDispatch, useSelector} from 'react-redux';

import {readExifOrientation} from './imageOrientation.helpers';
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
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    let imgWidth = imageData.width;
    let imgHeight = imageData.height;
    if (!imgWidth || !imgHeight) {
      const size = await getImageHeightAndWidth(tempImageURI);
      imgWidth = size.width;
      imgHeight = size.height;
    }
    // Always run through ImageResizer to bake EXIF orientation into pixel data.
    // MapboxGL's ImageSource ignores EXIF tags, causing portrait images to render
    // as landscape when used as a basemap if EXIF is not baked in.
    // Pass the actual dimensions (capped at max) as the target so small images are
    // not upscaled — ImageResizer scales to fit within the target box.
    const targetWidth = Math.min(imgWidth, IMAGE_MAX_LOCAL_SIZE);
    const targetHeight = Math.min(imgHeight, IMAGE_MAX_LOCAL_SIZE);
    // RCTImageLoader (inside ImageResizer) applies the 90°/270° EXIF orientations but drops
    // the 180°/"Down" case (tag 3), then strips the tag — leaving those photos upside down.
    // Detect that case from the source EXIF and pass an explicit 180° rotation to compensate.
    const orientation = await readExifOrientation(tempImageURI);
    const rotation = orientation === 3 ? 180 : 0;
    return await ImageResizer.createResizedImage(tempImageURI, targetWidth, targetHeight, 'JPEG', 100, rotation);
  };

  const resizeImageForThumbnail = async (imageUri) => {
    const createResizedImageProps = [imageUri, IMAGE_MAX_THUMBNAIL_SIZE, IMAGE_MAX_THUMBNAIL_SIZE, 'JPEG', 100, 0];
    return await ImageResizer.createResizedImage(...createResizedImageProps);
  };

  const resizeImageForUpload = async (imageProps) => {
    try {
      console.log('Resizing Image', imageProps?.id, imageProps, '...');
      let imageHeight = imageProps?.height;
      let imageWidth = imageProps?.width;

      if (!imageWidth || !imageHeight) {
        ({width: imageWidth, height: imageHeight} = await getImageHeightAndWidth(imageProps.uri));
      }

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
        const resizedImage = await ImageResizer.createResizedImage(...createResizedImageProps);
        console.log('Resized Image:', imageProps.id, resizedImage);
        return resizedImage;
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
