import {Platform} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getLocalImageURI} from './imageURIs.helpers';
import useImageSize from './useImageSize';
import useCompassCore from '../../services/device/useCompassCore';
import useDevice from '../../services/device/useDevice';
import usePermissions from '../../services/device/usePermissions';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import {getNewId, isEmpty} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import {openedMessageModal, setLoadingStatus} from '../home/home.slice';
import {setCurrentImageBasemap} from '../maps/maps.slice';
import {
  addedChangedImageId,
  removedChangedImageIds,
  updatedModifiedTimestampsBySpotsIds,
} from '../project/projects.slice';
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

  const {getCurrentCameraAngles, startCameraAnglesCapture, stopCameraAnglesCapture} = useCompassCore();
  const {copyFiles, deleteFromDevice, doesDeviceDirExist, makeDirectory, moveFile, readDirectory} = useDevice();
  const {getImageHeightAndWidth, resizeImageForDevice} = useImageSize();
  const navigation = useNavigation();
  const {hasCameraPermission} = usePermissions();
  const toast = useToast();

  /* Exported Functions */

  const deleteImageFile = async (imageId) => {
    // Nothing left to re-upload once the file is gone; updateImage re-adds the id straight afterwards
    dispatch(removedChangedImageIds([imageId]));
    if (Platform.OS !== 'web') {
      const localImageFile = getLocalImageURI(imageId);
      const fileExists = await doesDeviceDirExist(localImageFile);
      if (fileExists) await deleteFromDevice(localImageFile);
    }
  };

  const deleteImageFromSpot = async (imageId, spotWithImage) => {
    const spotsOnImage = Object.values(spots).filter(spot => spot.properties.image_basemap === imageId);
    if (spotsOnImage && spotsOnImage.length >= 1) {
      dispatch(openedMessageModal({
        message: 'Delete the spots before trying to delete the image.',
        title: 'Image Basemap Contains Spots!',
      }));
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
      dispatch(openedMessageModal({message: `Image ${imageId} could not be deleted.`, title: 'Error Deleting Image!'}));
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
          try {
            if (response.didCancel) {
              dispatch(setLoadingStatus({view: 'home', bool: false}));
              res(newImages);  // Resolve, or the caller awaits a Promise that never settles
            }
            // Every errorCode is a failure, not just 'others', and errorMessage is a string
            else if (response.errorCode) throw Error(response.errorMessage || response.errorCode);
            else {
              let imageAsset = response.assets;
              await Promise.all(
                imageAsset.map(async (image) => {
                  imageCount++;
                  const resizedImage = await resizeImageForDevice(image);
                  const savedPhoto = await saveFile(resizedImage);
                  newImages.push(savedPhoto);
                  console.log('Saved Photo in getImagesFromCameraRoll:', savedPhoto);
                }),
              );
              res(newImages);
            }
          }
          catch (err) {
            // This callback is async, so a throw escapes the try below, which only guards
            // launchImageLibrary itself. Uncaught, the Promise never settles and the import hangs.
            // Reported here rather than rejected because the caller does not catch.
            console.error('Error Importing Images:', err);
            dispatch(openedMessageModal({message: `${err}`, title: 'Error Getting Image!'}));
            dispatch(setLoadingStatus({view: 'home', bool: false}));
            res(newImages);  // Keep any images already imported
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
        const {height, id, width, ...compassData} = savedPhoto;
        const photoProperties = {id, image_type: 'photo', height, width, ...compassData};
        console.log('Photos to Save:', [...newImages, photoProperties]);
        newImages.push(photoProperties);
        return launchCameraLoop();
      }
    }
    catch (err) {
      console.error(`Error Taking Picture: ${err}`);
      dispatch(openedMessageModal({message: `${err}`, title: 'Error Getting Image!'}));
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      return newImages;  // Keep any photos already taken before the error
    }
  };

  // Always resolves to an array — callers read its length
  const launchCameraFromNotebook = async () => {
    try {
      if (!await hasCameraPermission()) return [];
      newImages = [];
      return await launchCameraLoop();
    }
    catch (err) {
      console.error(`Error Taking Picture: ${err}`);
      dispatch(openedMessageModal({message: `${err}`, title: 'Error Getting Image!'}));
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      return [];
    }
  };

  // An overrideId saves under that id instead of a new one. The destination must be free — copyFile
  // does not overwrite on iOS.
  const saveFile = async (imageData, overrideId) => {
    console.log('New image data:', imageData);
    let imgHeight = imageData.height;
    let imgWidth = imageData.width;
    const tempImageURI = Platform.OS === 'ios' ? imageData.uri || imageData.path : imageData.uri || 'file://' + imageData.path;
    if (!imgHeight || !imgWidth) {
      const newImageDimensions = await getImageHeightAndWidth(tempImageURI);
      imgHeight = newImageDimensions.height;
      imgWidth = newImageDimensions.width;
    }
    let imageId = overrideId || getNewId();
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
      const updatedImages = selectedSpot.properties.images.map(i => i.id === imageCopy.id ? imageCopy : i);
      console.log(updatedImages);
      dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot.properties.id]));
      dispatch(editedSpotProperties({field: 'images', value: updatedImages}));
    }
    if (!imageCopy.annotated) dispatch(setCurrentImageBasemap(undefined));
  };

  // Opens the camera and saves one photo. Camera permission is verified upstream in
  // launchCameraFromNotebook before this loop is entered.
  const takePicture = async () => {
    await startCameraAnglesCapture();
    return new Promise((resolve, reject) => {
      try {
        launchCamera({cameraType: 'back', saveToPhotos: true}, async (response) => {
          console.log('Launch Camera Response:', response);
          try {
            if (response.didCancel) {
              stopCameraAnglesCapture();
              resolve('cancelled');
            }
            // react-native-image-picker reports failures as errorCode, not error
            else if (response.errorCode) throw Error(response.errorMessage || response.errorCode);
            else {
              const imageAsset = response.assets[0];
              const compassReading = getCurrentCameraAngles();
              stopCameraAnglesCapture();
              const resizedImage = await resizeImageForDevice(imageAsset);
              console.log('Resized Image:', resizedImage);
              const savedFile = await saveFile(resizedImage);
              resolve({...savedFile, ...compassReading});
            }
          }
          catch (err) {
            // This callback is async, so a throw escapes the try below, which only guards launchCamera
            // itself. Uncaught, the Promise never settles and the camera loop hangs with nothing shown.
            stopCameraAnglesCapture();
            dispatch(setLoadingStatus({view: 'home', bool: false}));
            reject(err);
          }
        });
      }
      catch (e) {
        dispatch(setLoadingStatus({view: 'home', bool: false}));
        reject(e);
      }
    });
  };

  // Replaces an image's file but keeps its id, so nothing referring to the image has to be re-pointed;
  // the new modified_timestamp is what gets past the URI-keyed caches (see getLocalImageURI). The id is
  // queued as changed because the server reports an id it already has as present. Staged under a temp
  // id first, so a copy that fails partway leaves the original file intact.
  const updateImage = async (image, path) => {
    const stagedId = getNewId();
    const {height, width} = await saveFile({...image, 'path': path}, stagedId);
    await deleteImageFile(image.id);
    await moveFile(APP_DIRECTORIES.IMAGES + stagedId + '.jpg', APP_DIRECTORIES.IMAGES + image.id + '.jpg');
    const updatedImage = {...image, height: height, width: width, modified_timestamp: Date.now()};
    dispatch(addedChangedImageId(image.id));
    if (currentImageBasemap?.id === image.id) dispatch(setCurrentImageBasemap(updatedImage));
    return updatedImage;
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
    saveFile,
    saveImageFromDownloadsDir,
    setAnnotation,
    takePicture,
    updateImage,
  };
};

export default useImages;
