import React, {useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import {Icon} from 'react-native-elements';
import {useDispatch} from 'react-redux';

import {getImageMetaFromWeb, getSize, resizeFile} from './imageHelpers';
import {imageStyles, useImages} from './index';
import useUpload from '../../services/useUpload';
import commonStyles from '../../shared/common.styles';
import {getNewId} from '../../shared/Helpers';
import ButtonRounded from '../../shared/ui/ButtonRounded';
import {setLoadingStatus} from '../home/home.slice';
import SketchModal from '../sketch/SketchModal';

const AddImageButtons = ({saveImages}) => {
  const dispatch = useDispatch();

  const {getImagesFromCameraRoll, launchCameraFromNotebook} = useImages();
  const {uploadFromWeb} = useUpload();

  const inputRef = useRef(null);

  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);

  const clickedFileInput = () => {
    window.addEventListener('focus', handleFocusBack);
  };

  const handleFileChange = async (e) => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));

    console.log('Target', e.target.value);
    let imageToUpload = e.target.files[0];
    const imageId = getNewId();

    if (e.target.files.length === 0) {
      console.log('No File Selected');
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    else {
      const metaData = await getImageMetaFromWeb(e.target.files[0]);
      console.log('MetaData', metaData);

      if (metaData.fileSize > 3000000) {
        console.log('Target BEFORE resizing', e.target.files[0]);
        const before = getSize(e.target.files[0]);
        console.log('Target size BEFORE resizing', before);

        // setSelectedImageFile(e.target.files[0]);
        imageToUpload = await resizeFile(e.target.files[0], metaData.height, metaData.width);
        const after = getSize(imageToUpload);
        console.log('Target AFTER resizing', e.target.files[0]);
        console.log('Target size AFTER resizing', after);
      }
      const imageObj = {
        id: imageId,
        height: metaData.height,
        width: metaData.width,
      };
      const res = await uploadFromWeb(imageId, imageToUpload);
      console.log('uploadFromWeb res', res);
      saveImages([imageObj]);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const handleFocusBack = () => {
    console.log('focus-back');
    dispatch(setLoadingStatus({view: 'home', bool: false}));
    window.removeEventListener('focus', handleFocusBack);
  };

  const importImages = async () => {
    dispatch(setLoadingStatus({view: 'home', bool: true}));
    if (Platform.OS !== 'web') {
      const newImages = await getImagesFromCameraRoll();
      console.log('newImages', newImages);
      saveImages(newImages);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    else {
      console.log('Import from web');
      await inputRef.current.click();
    }
  };

  const takePhoto = async () => {
    const newImages = await launchCameraFromNotebook();
    const imagesSavedLength = newImages.length;
    if (imagesSavedLength > 0) saveImages(newImages);
  };

  return (
    <>
      <View style={imageStyles.buttonsContainer}>
        {Platform.OS === 'web' ? (
          <input
            style={{display: 'none'}}
            id={'selectedImage'}
            ref={inputRef}
            type={'file'}
            name={'image'}
            accept={'image/*'}
            onChange={handleFileChange}
            onClick={clickedFileInput}
          />
        ) : (
          <ButtonRounded
            icon={
              <Icon
                name={'camera-outline'}
                type={'ionicon'}
                iconStyle={imageStyles.icon}
                color={commonStyles.iconColor.color}/>
            }
            title={'Take'}
            titleStyle={commonStyles.standardButtonText}
            buttonStyle={imageStyles.buttonContainer}
            type={'outline'}
            onPress={takePhoto}
          />
        )}
        <ButtonRounded
          icon={
            <Icon
              name={'images-outline'}
              type={'ionicon'}
              iconStyle={imageStyles.icon}
              color={commonStyles.iconColor.color}/>
          }
          title={'Import'}
          titleStyle={commonStyles.standardButtonText}
          buttonStyle={imageStyles.buttonContainer}
          type={'outline'}
          onPress={importImages}
        />
        {Platform.OS !== 'web' && (
          <ButtonRounded
            icon={
              <Icon
                name={'images-outline'}
                type={'ionicon'}
                iconStyle={imageStyles.icon}
                color={commonStyles.iconColor.color}/>
            }
            title={'Sketch'}
            titleStyle={commonStyles.standardButtonText}
            buttonStyle={imageStyles.buttonContainer}
            type={'outline'}
            onPress={() => setIsSketchModalVisible(true)}
          />
        )}
      </View>
      {isSketchModalVisible && <SketchModal saveImages={saveImages} setIsSketchModalVisible={setIsSketchModalVisible}/>}
    </>
  );
};

export default AddImageButtons;
