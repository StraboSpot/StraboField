import {useState} from 'react';

import ImageResizer from '@bam.tech/react-native-image-resizer';
import {useDispatch, useSelector} from 'react-redux';

import {updatedProjectTransferProgress} from './connections.slice';
import {APP_DIRECTORIES} from './directories.constants';
import useDevice from './useDevice';
import useServerRequests from './useServerRequests';
import {addedStatusMessage, clearedStatusMessages, setIsProgressModalVisible} from '../modules/home/home.slice';
import {useImages} from '../modules/images';
import {setIsImageTransferring} from '../modules/project/projects.slice';
import {isEmpty} from '../shared/Helpers';

const useUploadImages = () => {
  // const imagesToUpload = [];
  const tempImagesDownsizedDirectory = APP_DIRECTORIES.APP_DIR + '/TempImages';

  const {deleteTempImagesFolder, doesDeviceDirExist, makeDirectory} = useDevice();
  const {getAllImages, getImageHeightAndWidth, getLocalImageURI} = useImages();
  const {uploadImage, verifyImagesExistence} = useServerRequests();

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const spots = useSelector(state => state.spot.spots);

  const [currentImage, setCurrentImage] = useState('');
  const [currentImageStatus, setCurrentImageStatus] = useState({success: 0, failed: 0});
  const [totalImages, setTotalImages] = useState(0);
  const [imageUploadStatusMessage, setImageUploadStatusMessage] = useState('');

  const resetState = () => {
    console.log('resetting State', imageUploadStatusMessage);
    setImageUploadStatusMessage('');
    setCurrentImage('');
    setCurrentImageStatus({success: 0, failed: 0});
  };

  // Gather all the images in spots and returns the ids.
  const getImageIds = (images) => {
    const imageIds = [];
    images.forEach(image => imageIds.push(image.id));
    console.log(imageIds);
    return imageIds;
  };

  const initializeImageUpload = async () => {
    let imagesStatus = {};
    setImageUploadStatusMessage('');
    console.log('Looking for Images to Upload in Spots...', spots);
    setImageUploadStatusMessage('Looking for images to upload in spots...');
    const images = getAllImages();
    const imageIds = getImageIds(images);
    setImageUploadStatusMessage('Checking to see if image files are on server...');
    const neededImages = await verifyImagesExistence(imageIds, user.encoded_login);
    setImageUploadStatusMessage(`Checking to see if ${neededImages.length} image files are on device...`);
    console.log('Needed Images from server', neededImages);
    const {imagesToUpload, imagesNotFoundOnDevice} = await verifyImageExistsOnDevice(neededImages, images);
    console.log('Done verifying images on device', imagesToUpload);
    if (!isEmpty(imagesToUpload)) {
      setImageUploadStatusMessage('Uploading needed images to server...');
      dispatch(setIsImageTransferring(true));
      imagesStatus = await uploadImages(imagesToUpload);
      console.log('DONE UPLOADING IMAGES');
    }
    else setImageUploadStatusMessage('All images for this project are already on server.');
    if (!isEmpty(imagesNotFoundOnDevice)) {
      imagesStatus = {...imagesStatus, imagesNotFound: imagesNotFoundOnDevice.length};
    }
    return imagesStatus;
  };

  // Downsize image for upload
  const resizeImageForUpload = async (imageProps) => {
    try {
      console.log('Resizing Image', imageProps?.id, '...');
      let height = imageProps?.height;
      let width = imageProps?.width;

      if (!width || !height) ({width, height} = await getImageHeightAndWidth(imageProps.uri));

      if (width > 2000 || height > 2000) {
        const max_size = 2000;
        if (width > height && width > max_size) {
          height = max_size * height / width;
          width = max_size;
        }
        else if (height > max_size) {
          width = max_size * width / height;
          height = max_size;
        }

        await makeDirectory(tempImagesDownsizedDirectory);
        const createResizedImageProps = [imageProps.uri, width, height, 'JPEG', 100, 0, tempImagesDownsizedDirectory];
        return await ImageResizer.createResizedImage(...createResizedImageProps);
      }
      else return imageProps;
    }
    catch (err) {
      console.error('Error Resizing Image.', err);
      throw Error('Error Resizing Image.', err);
    }
  };

  const verifyImageExistsOnDevice = async (neededImageIds, imagesFound) => {
    const imagesToUpload = [];
    const imagesNotFoundOnDevice = [];
    await Promise.all((
      neededImageIds.map(async (imageId) => {
          const imageURI = getLocalImageURI(imageId);
          const isValidImageURI = await doesDeviceDirExist(imageURI);
          if (isValidImageURI) {
            console.log(`Image ${imageId} EXISTS`);
            return imagesFound.find((image) => {
              if (image.id.toString() === imageId) {
                imagesToUpload.push({...image, uri: imageURI});
                // setImagesToUpload(prevState => ([...prevState, imageWithPath]));
                // return {...image, uri: imageURI};
              }
            });
          }
          else {
            console.log('Local file not found for image:' + imageId);
            imagesNotFoundOnDevice.push(imageId);
          }
        },
      )
    ));
    return {imagesToUpload: imagesToUpload, imagesNotFoundOnDevice: imagesNotFoundOnDevice};
  };

  // Upload the image to server
  const doUploadImage = async (imageId, imageUri, isProfileImage) => {
    try {
      setCurrentImage(imageId);

      console.log(': Uploading Image', imageId, '...');

      let formdata = new FormData();
      formdata.append('image_file', {uri: imageUri, name: 'image.jpg', type: 'image/jpeg'});
      formdata.append('id', imageId);
      formdata.append('modified_timestamp', Date.now());
      const res = await uploadImage(formdata, user.encoded_login, isProfileImage);
      console.log('Image Upload Res', res);
      console.log(': Finished Uploading Image', imageId);
      dispatch(updatedProjectTransferProgress(0));
    }
    catch (err) {
      console.log('Error Uploading Image', imageId, err);
      throw Error('Error Uploading Image', imageId, err);
    }
  };

  const uploadImages = async (imagesToUpload) => {
    let imagesUploadedCount = 0;
    let imagesUploadFailedCount = 0;

    // Start uploading image by getting the image file, downsizing the image and then uploading
    const startUploadingImage = async (imageProps) => {
      try {
        // const imageURI = await getImageFile(imageProps.id);
        const resizedImage = await resizeImageForUpload(imageProps);
        await doUploadImage(imageProps.id, resizedImage.uri);
        imagesUploadedCount++;
      }
      catch (err) {
        console.error(`Failed to upload image ${imageProps.id} because ${err.Error}`);
        imagesUploadFailedCount++;
      }

      setCurrentImageStatus({success: imagesUploadedCount, failed: imagesUploadFailedCount});

      if (imagesUploadedCount + imagesUploadFailedCount < imagesToUpload.length) {
        await startUploadingImage(imagesToUpload[imagesUploadedCount + imagesUploadFailedCount]);
      }
      else {
        if (imagesUploadFailedCount > 0) {
          setImageUploadStatusMessage(
            `Finished uploading images with Errors.\n ${imagesUploadFailedCount} Images failed to upload\n`);
        }
        else setImageUploadStatusMessage(`Finished uploading ${imagesUploadedCount} images to server.`);
      }
    };

    if (imagesToUpload.length > 0) {
      setImageUploadStatusMessage(
        `Uploading ${imagesToUpload.length} image${imagesToUpload.length <= 1 ? '' : 's'}...`);
      setTotalImages(imagesToUpload.length);
      await startUploadingImage(imagesToUpload[0]);
      return ({success: imagesUploadedCount, failed: imagesUploadFailedCount});
    }
    else setImageUploadStatusMessage('\nNo images to upload');
    await deleteTempImagesFolder();
    dispatch(setIsProgressModalVisible(false));
  };

  const uploadProfileImage = async () => {
    try {
      await doUploadImage('profileImage', 'file://' + APP_DIRECTORIES.PROFILE_IMAGE, true);
      console.log('Profile Image Uploaded');
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Profile Image Uploaded'));
    }
    catch (err) {
      console.error(`Failed to upload profile image because ${err.Error}`);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage('Failed to upload profile image'));
      throw Error();
    }
  };

  return {
    initializeImageUpload,
    resizeImageForUpload,
    verifyImageExistsOnDevice,
    uploadImages,
    uploadProfileImage,
    currentImage,
    currentImageStatus,
    resetState,
    totalImages,
    imageUploadStatusMessage,
  };
};

export default useUploadImages;
