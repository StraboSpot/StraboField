import React from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Icon, ListItem} from '@rn-vui/base';
import RNFS from 'react-native-fs';
import {useDispatch, useSelector} from 'react-redux';

import RockdLogo from '../../../assets/images/logos/rockd_transparent.png';
import ImageThumbnail from '../../../modules/images/ImageThumbnail';
import {getLocalImageURI} from '../../../modules/images/imageURIs.helpers';
import useImageSize from '../../../modules/images/useImageSize';
import useImageThumbnails from '../../../modules/images/useImageThumbnails';
import {editedSpotProperties} from '../../../modules/spots/spots.slice';
import {addedCheckedInSpotId, setMacrostratToken} from '../../../modules/user/userProfile.slice';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, toError} from '../../../shared/helpers';
import {BLUE, DARKGREY} from '../../../shared/styles.constants';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import useDevice from '../../device/useDevice';
import useServerRequests from '../../network/useServerRequests';

const STATUS_MESSAGES = {
  converting: 'Converting spot to Rockd format...',
  sending: 'Sending check-in to Rockd...',
  success: 'Successfully checked in to Rockd!',
};

const RockdModal = ({closeModal, isVisible}) => {
  const dispatch = useDispatch();
  const {deleteTempImagesFolder, doesDeviceDirExist} = useDevice();
  const {resizeImageForUpload} = useImageSize();
  const {
    convertSpotToMacrostrat,
    openMacrostratLogin,
    postCheckinImageToRockd,
    postCheckinToRockd,
  } = useServerRequests();

  const macrostratToken = useSelector(state => state.user.macrostrat?.token);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const [checkInStatus, setCheckInStatus] = React.useState('idle');
  const [availableImages, setAvailableImages] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [pendingUploads, setPendingUploads] = React.useState(null);
  const [selectedImageId, setSelectedImageId] = React.useState(null);
  const [uploadProgress, setUploadProgress] = React.useState({current: 0, total: 0});

  const {areImageThumbnailsLoading, imageThumbnailURIs} = useImageThumbnails({images: availableImages});

  const coverImage = availableImages.find(image => image.id === selectedImageId);
  const isLoading = ['converting', 'sending', 'uploading'].includes(checkInStatus);
  const isSelectingImage = checkInStatus === 'selectingImage';
  const successMessage = isEmpty(availableImages) && !isEmpty(selectedSpot?.properties?.images)
    ? `${STATUS_MESSAGES.success} This Spot's images are not on this device, so none were sent.`
    : STATUS_MESSAGES.success;
  const statusMessage = checkInStatus === 'uploading'
    ? `Sending image ${uploadProgress.current} of ${uploadProgress.total} to Rockd...`
    : STATUS_MESSAGES[checkInStatus];

  React.useEffect(() => {
    if (macrostratToken && selectedSpot && isVisible) {
      startCheckIn().catch(err => showError('RockdModal image lookup error', err));
    }
  }, [macrostratToken, isVisible]);

  const handleCheckIn = async (cover) => {
    try {
      // The converter makes the first image the check-in photo and each of the rest an observation, so send only
      // the images on this device, with the cover first
      const images = cover ? [cover, ...availableImages.filter(image => image !== cover)] : [];

      console.log('RockdModal check-in CONVERTING');
      setCheckInStatus('converting');
      const converted = await convertSpotToMacrostrat(
        {...selectedSpot, properties: {...selectedSpot.properties, images}});
      if (!converted) throw new Error('Conversion returned an empty result');

      console.log('RockdModal check-in SENDING');
      setCheckInStatus('sending');
      const checkInResponse = await postCheckinToRockd({...converted, token: macrostratToken});

      // A 400 resolves with its body rather than rejecting, so a failed check-in arrives here too
      const checkInId = checkInResponse?.success?.data?.checkin_id;
      if (!checkInId) throw new Error(checkInResponse?.error?.message ?? 'Rockd did not return a check-in id');

      console.log('RockdModal check-in SUCCESS', checkInResponse);
      dispatch(addedCheckedInSpotId(selectedSpot.properties.id));
      dispatch(
        editedSpotProperties({
          field: 'rockd_checkin_id',
          value: checkInId,
        }),
      );
      // Each photo comes back with the type and id to post its image to, matched by local_id (<image id>.jpg)
      const uploads = (checkInResponse.success.data.photos ?? [])
        .map(photo => ({...photo, image: images.find(image => `${image.id}.jpg` === photo.local_id)}))
        .filter(upload => upload.image);
      await uploadImages({spotId: selectedSpot.properties.id, uploads});
    }
    catch (err) {
      showError('RockdModal check-in error', err);
    }
  };

  const handleDoNotInclude = () => {
    setSelectedImageId(null);
    handleCheckIn();
  };

  // Once the check-in exists, send only the images still to go, since repeating the check-in would duplicate it in Rockd
  const handleRetry = () => (
    pendingUploads?.spotId === selectedSpot.properties.id ? uploadImages(pendingUploads) : handleCheckIn(coverImage)
  );

  const showError = (logMessage, err) => {
    console.error(logMessage, err);
    setErrorMessage(toError(err).message);
    setCheckInStatus('error');
  };

  const startCheckIn = async () => {
    if (pendingUploads?.spotId === selectedSpot.properties.id) return uploadImages(pendingUploads);

    setCheckInStatus('idle');
    setSelectedImageId(null);
    const images = selectedSpot.properties.images ?? [];
    const areImagesOnDevice = await Promise.all(images.map(image => doesDeviceDirExist(getLocalImageURI(image.id))));
    const imagesOnDevice = images.filter((_, index) => areImagesOnDevice[index]);
    setAvailableImages(imagesOnDevice);
    if (isEmpty(imagesOnDevice)) handleCheckIn();
    else setCheckInStatus('selectingImage');
  };

  // Rockd takes one image per request
  const uploadImages = async ({spotId, uploads}) => {
    let sent = 0;
    try {
      setCheckInStatus('uploading');
      for (const {id, image, type} of uploads) {
        setUploadProgress({current: sent + 1, total: uploads.length});
        const uri = getLocalImageURI(image.id, image.modified_timestamp);
        const resizedImage = await resizeImageForUpload({...image, uri});
        const imageBase64 = await RNFS.readFile(resizedImage.uri.split('?')[0].replace('file://', ''), 'base64');
        const imageResponse = await postCheckinImageToRockd(type, id, imageBase64, macrostratToken);
        if (imageResponse?.error) throw new Error(imageResponse.error.message);
        sent++;
      }
      setPendingUploads(null);
      setCheckInStatus('success');
    }
    catch (err) {
      setPendingUploads({spotId, uploads: uploads.slice(sent)});
      showError('RockdModal image upload error', err);
    }
    finally {
      await deleteTempImagesFolder();
    }
  };

  const renderCoverImagePicker = () => (
    <View style={{flex: 1, gap: 12}}>
      <Text style={{fontSize: 16, textAlign: 'center'}}>
        Select a main cover image for this check-in. The other images will be sent with it.
      </Text>
      <ScrollView contentContainerStyle={{flexDirection: 'row', flexWrap: 'wrap'}} style={{flex: 1}}>
        {availableImages.map(image => (
          <View key={image.id} style={{width: '50%'}}>
            <ListItem
              containerStyle={[commonStyles.listItem, {padding: 4}]}
              onPress={() => setSelectedImageId(image.id)}
            >
              <ListItem.CheckBox
                checked={image.id === selectedImageId}
                checkedIcon={<Icon color={BLUE} name={'radiobox-marked'} type={'material-community'}/>}
                onPress={() => setSelectedImageId(image.id)}
                uncheckedIcon={<Icon color={DARKGREY} name={'radiobox-blank'} type={'material-community'}/>}
              />
              <ImageThumbnail
                imageThumbnailURI={imageThumbnailURIs[image.id]}
                isImageThumbnailLoading={areImageThumbnailsLoading[image.id]}
                isThumbnailOnly={true}
                onImagePressed={() => setSelectedImageId(image.id)}
              />
            </ListItem>
          </View>
        ))}
      </ScrollView>
      <OutlineButton onPress={handleDoNotInclude} title={'Do Not Include'}/>
    </View>
  );

  return (
    <ModalWrapper
      actionTitle={'Send Check-In'}
      closeModal={closeModal}
      disabled={!coverImage}
      headerImage={RockdLogo}
      imageStyle={{height: 100, width: 250, marginBottom: 20}}
      isChildrenFilled={isSelectingImage}
      isVisible={isVisible}
      onActionPressed={() => handleCheckIn(coverImage)}
      onBackdropPress={closeModal}
      overlayStyleOverride={{height: 'auto', width: '80%', maxWidth: 400, maxHeight: '80%'}}
      showActionButton={isSelectingImage}
      showCancelButton={false}
      showCloseButton={true}
    >
      {isSelectingImage ? renderCoverImagePicker() : (
        <View style={{alignItems: 'center', gap: 12}}>
          {macrostratToken ? (
            <>
              {checkInStatus !== 'idle' && (
                <LottieAnimations
                  doesLoop={isLoading}
                  type={isLoading ? 'uploading' : checkInStatus === 'error' ? 'error' : 'complete'}
                />
              )}
              <Text style={{fontSize: 16, textAlign: 'center'}}>
                {checkInStatus === 'error' ? errorMessage
                  : checkInStatus === 'success' ? successMessage : statusMessage}
              </Text>
              {checkInStatus === 'error' && (
                <OutlineButton onPress={handleRetry} title={'Retry'}/>
              )}
            </>
          ) : (
            <OutlineButton
              onPress={openMacrostratLogin}
              title={'Login to Rockd'}
            />
          )}
          {__DEV__ && (
            <OutlineButton
              onPress={() => dispatch(setMacrostratToken({token: null, expires: null}))}
              title={'[DEV] Clear Rockd Token'}
            />
          )}
        </View>
      )}
    </ModalWrapper>
  );
};

export default RockdModal;
