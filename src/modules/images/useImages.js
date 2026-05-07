import {PermissionsAndroid, Platform} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getLocalImageURI} from './imageURIs.helpers';
import useImageSize from './useImageSize';
import useDevice from '../../services/device/useDevice';
import usePermissions from '../../services/device/usePermissions';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import {getNewId, isEmpty} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import {
  addedStatusMessage,
  clearedStatusMessages,
  setIsErrorMessagesModalVisible,
  setLoadingStatus,
} from '../home/home.slice';
import {setCurrentImageBasemap} from '../maps/maps.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {clearedSelectedSpots, editedSpotProperties, setSelectedSpot} from '../spots/spots.slice';

let imageCount = 0;
let newImages = [];

const useImages = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const project = useSelector(state => state.project.project);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const {copyFiles, deleteFromDevice, doesDeviceDirExist, makeDirectory, moveFile, readDirectory} = useDevice();
  const {getImageHeightAndWidth, resizeImageIfNecessary} = useImageSize();
  const navigation = useNavigation();
  const {checkPermission, requestPermission} = usePermissions();
  const toast = useToast();

  /* Exported Functions */

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
      dispatch(updatedModifiedTimestampsBySpotsIds([spotWithImage.properties.id]));
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

  // Get images from Spots and Reports
  const getAllImages = () => {
    const images = [];
    Object.values(spots).forEach(spot => spot?.properties?.images?.map(image => images.push(image)));
    if (!isEmpty(project.reports)) project.reports.forEach(report => report.images?.map(image => images.push(image)));
    return images;
  };

  // INTERNAL
  const getAllImagesIds = (spotsArray) => {
    let imageIds = [];
    spotsArray.filter((spot) => {
      if (spot.properties.images) spot.properties.images.map(image => imageIds.push(image.id));
    });
    return imageIds;
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

  const getImageByImageId = (imageId) => {
    const images = getAllImages();
    const image = images.find(i => i.id.toString() === imageId.toString());
    return image;
  };

  const getImagesFromCameraRoll = async () => {
    newImages = [];
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

  const launchCameraLoop = async () => {
    try {
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
        return launchCameraLoop();
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

  const launchCameraFromNotebook = async () => {
    try {
      const permissionResult = Platform.OS === 'ios' ? true
        : await checkPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (permissionResult) {
        newImages = [];
        return launchCameraLoop();
      }
      else {
        const permissionRequestResult = await requestPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (permissionRequestResult === 'granted' || permissionRequestResult === 'never_ask_again') {
          newImages = [];
          return launchCameraLoop();
        }
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
          message: 'StraboSpot needs access to your camera so you can take pictures.',
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
              const resizedImage = await resizeImageIfNecessary(imageAsset);
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
    deleteImageFile,
    deleteImageFromSpot,
    doesImageExistOnDevice,
    gatherNeededImages,
    getAllImages,
    getAllImagesIds,
    getImageBasemap,
    getImageByImageId,
    getImagesFromCameraRoll,
    launchCameraFromNotebook,
    requestCameraPermission,
    saveFile,
    saveImageFromDownloadsDir,
    setAnnotation,
    takePicture,
  };
};

export default useImages;
