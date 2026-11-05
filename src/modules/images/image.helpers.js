import Resizer from 'react-image-file-resizer';

import {IMAGE_MAX_UPLOAD_SIZE} from './images.constants';

export const getImageMetaFromWeb = async (imageFile) => {
  const {name} = imageFile;
  const fileExtension = name.split('.').pop();
  const fileSize = imageFile.size;
  const localUrl = URL.createObjectURL(imageFile);

  const getImageParams = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let image = new Image();
        image.src = e.target.result;
        await image.decode();
        // now we can
        resolve({width: image.width, height: image.height});
      };
      reader.readAsDataURL(file);
    });
  };
  const {width, height} = await getImageParams(imageFile);
  console.log('Width', width, 'Height', height);
  return {width, height, fileSize: fileSize, fileExtension, localUrl};
};

export const getSize = (image) => {
  let imageSizeText;
  if (image.size < 1024) imageSizeText = image.size + ' bytes';
  else if (image.size < 1048576) imageSizeText = (image.size / 1024).toFixed(3) + ' kB';
  else if (image.size < 1073741824) imageSizeText = (image.size / 1048576).toFixed(2) + ' MB';
  else imageSizeText = (image.size / 1073741824).toFixed(3) + ' GB';
  return imageSizeText;
};

// Web only: takes a browser File from the file input. Native photos are resized in useImageSize instead.
// Scales the image down to fit within a square box, keeping its proportions, so the longer side ends up at most
// IMAGE_MAX_UPLOAD_SIZE whichever way the photo is oriented. Images already within that are not enlarged.
export const resizeFileForWeb = async (file) => {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(file, IMAGE_MAX_UPLOAD_SIZE, IMAGE_MAX_UPLOAD_SIZE, 'JPEG', 100, 0, resolve, 'file');
  });
};
