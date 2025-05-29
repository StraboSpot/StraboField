import {Image, PermissionsAndroid, Platform} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from '../../services/directories.constants';
import {STRABO_APIS} from '../../services/urls.constants';
import useDevice from '../../services/useDevice';
import usePermissions from '../../services/usePermissions';
import {getNewId, isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsErrorMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {setCurrentImageBasemap} from '../maps/maps.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {clearedSelectedSpots, editedSpotImage, editedSpotProperties, setSelectedSpot} from '../spots/spots.slice';

const useImages = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const {copyFiles, deleteFromDevice, doesDeviceDirExist, makeDirectory, moveFile, readDirectory} = useDevice();
  const {checkPermission, requestPermission} = usePermissions();
  const {width, height} = useWindowSize();

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const project = useSelector(state => state.project.project);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  let imageCount = 0;
  let newImages = [];

  const deleteImageFile = async (imageId) => {
    if (Platform.OS !== 'web') {
      const localImageFile = getLocalImageURI(imageId);
      const fileExists = await doesDeviceDirExist(localImageFile);
      if (fileExists) await deleteFromDevice(localImageFile);
    }
  };

  const deleteImageFromSpot = async (imageId, spotWithImage) => {
    const spotsOnImage = Object.values(spots).filter(spot => spot.properties.image_basemap === imageId);
    if (spotsOnImage && spotsOnImage.length >= 1) {
      dispatch(clearedStatusMessages());
      dispatch(
        addedStatusMessage('Image Basemap contains Spots! \n\nDelete the spots, before trying to delete the image'));
      dispatch(setIsErrorMessagesModalVisible(true));
      return false;
    }
    else if (spotWithImage) {
      const imagesDataCopy = spotWithImage.properties.images;
      const allOtherImages = imagesDataCopy.filter(item => imageId !== item.id);
      dispatch(setSelectedSpot(spotWithImage));
      dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot.properties.id]));
      dispatch(editedSpotProperties({field: 'images', value: allOtherImages}));
      await deleteImageFile(imageId);
      if (currentImageBasemap && currentImageBasemap.id === imageId) dispatch(setCurrentImageBasemap(undefined));
      return true;
    }
    else {
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage(`There was an error deleting image ${imageId}`));
      dispatch(setIsErrorMessagesModalVisible(true));
    }
  };

  // Check to see if image is on the local device
  const doesImageExistOnDevice = async (imageId) => {
    try {
      const imageURI = getLocalImageURI(imageId);
      console.log('Looking on device for image at URI:', imageURI, '...');
      // console.log(`Image ${imageURI} Exists exists: ${exists}!!`);
      return await doesDeviceDirExist(imageURI);
    }
    catch (err) {
      console.error('Error Checking if Image Exists on Device.');
    }
  };

  const gatherNeededImages = async (spotsToSearch, dataset) => {
    try {
      let neededImagesIds = [];
      let imageIds;
      console.log('Gathering Needed Images for dataset', dataset.name, '(' + dataset.id + ') ...');
      if (dataset?.images?.imageIds) imageIds = dataset.images.imageIds;
      else imageIds = getAllImagesIds(spotsToSearch);

      if (Platform.OS === 'web') return {imageIds: imageIds};  // Don't care about neededImagesIds on web
      await Promise.all(
        imageIds.map(async (imageId) => {
          const doesExist = await doesImageExistOnDevice(imageId);
          if (!doesExist) {
            console.log('Need to download image:', imageId);
            neededImagesIds.push(imageId);
          }
          else console.log('Image', imageId, 'already exists on device. Not downloading.');
        }),
      );
      console.log('Promised Finished');
      return {neededImagesIds: neededImagesIds, imageIds: imageIds};
    }
    catch (err) {
      console.error('Error Gathering Images.', err);
    }
  };

  // INTERNAL
  const getAllImagesIds = (spotsArray) => {
    let imageIds = [];
    spotsArray.filter((spot) => {
      if (spot.properties.images) spot.properties.images.map(image => imageIds.push(image.id));
    });
    return imageIds;
  };

  // Get images from Spots and Reports
  const getAllImages = () => {
    const images = [];
    Object.values(spots).forEach(spot => spot?.properties?.images?.map(image => images.push(image)));
    if (!isEmpty(project.reports)) project.reports.forEach(report => report.images?.map(image => images.push(image)));
    return images;
  };

  const getImageBasemap = (image) => {
    dispatch(clearedSelectedSpots());
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    console.log('Pressed image basemap:', image);
    if (Platform.OS === 'web') {
      if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
      dispatch(clearedSelectedSpots());
      dispatch(setCurrentImageBasemap(image));
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    else {
      doesImageExistOnDevice(image.id)
        .then((doesExist) => {
          if (doesExist) {
            if (SMALL_SCREEN) navigation.navigate('HomeScreen', {screen: 'Map'});
            setTimeout(() => {
              dispatch(clearedSelectedSpots());
              dispatch(setCurrentImageBasemap(image));
            }, 500);
          }
          else {
            // dispatch(setLoadingStatus({view: 'home', bool: false}));
            alert('Missing Image!', 'Unable to find image file on this device.');
          }
        })
        .catch((e) => {
          dispatch(setLoadingStatus({view: 'home', bool: false}));
          console.error('Image not found', e);
        });
    }
    dispatch(setLoadingStatus({view: 'home', bool: false}));
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

  const getImageScreenSizedURI = (id) => {
    return STRABO_APIS.PUBLIC_IMAGE_RESIZED + Math.max(width, height) + '/' + id;
  };

  const getImageThumbnailURI = (id) => {
    return STRABO_APIS.PUBLIC_IMAGE_THUMBNAIL + id;
  };

  const getImageThumbnailURIs = async (images) => {
    try {
      let imageThumbnailURIs = {};
      await Promise.all(images.map(async (image) => {
        if (Platform.OS === 'web') {
          imageThumbnailURIs = {...imageThumbnailURIs, [image.id]: getImageThumbnailURI(image.id)};
        }
        else {
          const imageUri = getLocalImageURI(image.id);
          const exists = await doesDeviceDirExist(imageUri);
          if (exists) {
            const createResizedImageProps = [imageUri, 200, 200, 'JPEG', 100, 0];
            const resizedImage = await ImageResizer.createResizedImage(...createResizedImageProps);
            imageThumbnailURIs = {...imageThumbnailURIs, [image.id]: resizedImage.uri};
          }
          else imageThumbnailURIs = {...imageThumbnailURIs, [image.id]: undefined};
        }
      }));
      return imageThumbnailURIs;
    }
    catch (err) {
      console.error('Error creating thumbnails', err);
      // throw Error(err);
    }
  };

  const getImagesFromCameraRoll = async () => {
    return new Promise((res, rej) => {
      try {
        const selectionLimitNumber = Platform.OS === 'ios' ? 10 : 0;
        launchImageLibrary({selectionLimit: selectionLimitNumber}, async (response) => {
          console.log('RES', response);
          if (response.didCancel) dispatch(setLoadingStatus({view: 'home', bool: false}));
          else if (response.errorCode === 'others') {
            console.error(response.errorMessage('Error Here'));
            dispatch(setLoadingStatus({view: 'home', bool: false}));
          }
          else {
            let imageAsset = response.assets;
            await Promise.all(
              imageAsset.map(async (image) => {
                imageCount++;
                const resizedImage = await resizeImageIfNecessary(image);
                const savedPhoto = await saveFile(resizedImage);
                newImages.push(savedPhoto);
                console.log('Saved Photo in getImagesFromCameraRoll:', savedPhoto);
              }),
            );
            res(newImages);
          }
        });
      }
      catch (err) {
        console.error('Error saving image');
        dispatch(setLoadingStatus({view: 'home', bool: false}));
        rej('Error saving image.');
      }
    });
  };

  const getLocalImageURI = (id) => {
    if (Platform.OS === 'web') return STRABO_APIS.PUBLIC_IMAGE + id;
    else return 'file://' + APP_DIRECTORIES.IMAGES + id + '.jpg';
  };

  const launchCameraFromNotebook = async () => {
    try {
      const permissionResult = Platform.OS === 'ios' ? true
        : await checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (permissionResult) {
        const savedPhoto = await takePicture();
        dispatch(setLoadingStatus({view: 'home', bool: true}));
        if (savedPhoto === 'cancelled') {
          if (newImages.length > 0) console.log('ALL PHOTOS SAVED', newImages);
          else toast.show('No Photos Saved', {duration: 2000, type: 'warning'});
          dispatch(setLoadingStatus({view: 'home', bool: false}));
          return newImages;
        }
        else {
          const photoProperties = {
            id: savedPhoto.id,
            image_type: 'photo',
            height: savedPhoto.height,
            width: savedPhoto.width,
          };
          console.log('Photos to Save:', [...newImages, photoProperties]);
          newImages.push(photoProperties);
          return launchCameraFromNotebook();
        }
      }
      else {
        const permissionRequestResult = await requestPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (permissionRequestResult === 'granted' || permissionRequestResult === 'never_ask_again') await launchCameraFromNotebook();
        else toast.show('StraboSpot can not access your camera due to permission denial.');
      }
    }
    catch (err) {
      console.error(`Error Taking Picture: ${err}`);
      dispatch(clearedStatusMessages());
      dispatch(addedStatusMessage(`There was an error getting image:\n${err}`));
      dispatch(setIsErrorMessagesModalVisible(true));
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Requested',
          message:
            'StraboSpot needs access to your camera '
            + 'so you can take pictures.',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) console.log('You can use the camera');
      else console.log('Camera permission denied');
    }
    catch (err) {
      console.warn(err);
    }
  };

  const resizeImageIfNecessary = async (imageData) => {
    let imgHeight = imageData.height;
    let imgWidth = imageData.width;
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    if (!imgHeight || !imgWidth) ({imgHeight, imgWidth} = await getImageHeightAndWidth(tempImageURI));
    let resizedImage, createResizedImageProps;
    createResizedImageProps = (imgHeight > 4096 || imgWidth > 4096) ? [tempImageURI, 4096, 4096, 'JPEG', 100, 0]
      : [tempImageURI, imgWidth, imgHeight, 'JPEG', 100, 0];
    resizedImage = await ImageResizer.createResizedImage(...createResizedImageProps);
    return resizedImage;
  };

  const saveFile = async (imageData) => {
    console.log('New image data:', imageData);
    let imgHeight = imageData.height;
    let imgWidth = imageData.width;
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    if (!imgHeight || !imgWidth) {
      const newImageDimensions = await getImageHeightAndWidth(tempImageURI);
      imgHeight = newImageDimensions.height;
      imgWidth = newImageDimensions.width;
    }
    let imageId = getNewId();
    let imageURI = getLocalImageURI(imageId);
    try {
      const exists = await doesDeviceDirExist(APP_DIRECTORIES.IMAGES);
      if (!exists) await makeDirectory(APP_DIRECTORIES.IMAGES);
      await copyFiles(tempImageURI, APP_DIRECTORIES.IMAGES + imageId + '.jpg');
      console.log(imageCount, 'File saved to:', imageURI);
      // imageCount++;
      return {
        id: imageId,
        height: imgHeight,
        width: imgWidth,
      };
    }
    catch (err) {
      imageCount++;
      console.log('Error on', imageId, ':', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      throw Error(err);
    }
  };

  const saveImageFromDownloadsDir = async (image) => {
    const exists = await doesDeviceDirExist(APP_DIRECTORIES.IMAGES);
    console.log('EXISTS', exists);
    const source = image.fileCopyUri;
    const dest = APP_DIRECTORIES.IMAGES + image.name;
    console.log('source:', source, 'dest', dest);
    await moveFile(source, dest);
    const imagesInDir = await readDirectory(APP_DIRECTORIES.IMAGES);
    console.log('images in app directory', imagesInDir);
    // return imageRes;
  };

  const setAnnotation = (image, annotation, title) => {
    const imageCopy = JSON.parse(JSON.stringify(image));
    imageCopy.annotated = annotation;
    if (annotation && !imageCopy.title) imageCopy.title = title;
    if (selectedSpot && selectedSpot.properties && selectedSpot.properties.images) {
      const updatedImages = selectedSpot.properties.images.filter(image2 => imageCopy.id !== image2.id);
      console.log(updatedImages);
      updatedImages.push(imageCopy);
      dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot.properties.id]));
      dispatch(editedSpotProperties({field: 'images', value: updatedImages}));
    }
    if (!imageCopy.annotated) dispatch(setCurrentImageBasemap(undefined));
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
        if (currentImageBasemap.id === updatedImage.id) {
          dispatch(setCurrentImageBasemap(updatedImage));
        }
      }
    }
    else console.error('Error setting image height and width');
  };

  // Called from Notebook Panel Footer and opens camera only
  const takePicture = async () => {
    let permissionGranted;
    console.log(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (Platform.OS === 'android') permissionGranted = await checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (permissionGranted === 'granted' || Platform.OS === 'ios') {
      return new Promise((resolve, reject) => {
        try {
          launchCamera({saveToPhotos: true}, async (response) => {
            console.log('Launch Camera Response:', response);
            if (response.didCancel) resolve('cancelled');
            else if (response.error) reject();
            else {
              const imageAsset = response.assets[0];
              const createResizedImageProps = [imageAsset.uri, imageAsset.height, imageAsset.width, 'JPEG', 100, 0];
              const resizedImage = await ImageResizer.createResizedImage(...createResizedImageProps);
              console.log('Resized Image:', resizedImage);
              resolve(saveFile(resizedImage));
            }
          });
        }
        catch (e) {
          dispatch(setLoadingStatus({view: 'home', bool: false}));
          reject(e);
        }
      });
    }
  };

  return {
    deleteImageFile: deleteImageFile,
    deleteImageFromSpot: deleteImageFromSpot,
    doesImageExistOnDevice: doesImageExistOnDevice,
    gatherNeededImages: gatherNeededImages,
    getAllImages: getAllImages,
    getAllImagesIds: getAllImagesIds,
    getImageBasemap: getImageBasemap,
    getImageHeightAndWidth: getImageHeightAndWidth,
    getImageScreenSizedURI: getImageScreenSizedURI,
    getImageThumbnailURI: getImageThumbnailURI,
    getImageThumbnailURIs: getImageThumbnailURIs,
    getImagesFromCameraRoll: getImagesFromCameraRoll,
    getLocalImageURI: getLocalImageURI,
    launchCameraFromNotebook: launchCameraFromNotebook,
    requestCameraPermission: requestCameraPermission,
    saveFile: saveFile,
    saveImageFromDownloadsDir: saveImageFromDownloadsDir,
    setAnnotation: setAnnotation,
    setImageHeightAndWidth: setImageHeightAndWidth,
    takePicture: takePicture,
  };
};

export default useImages;
