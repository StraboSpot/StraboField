import Resizer from 'react-image-file-resizer';

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

export const resizeFile = async (file, height, width) => {
  let imageHeight, imageWidth;
  const max_size = 2000;
  if (width > height && width > max_size) {
    imageHeight = max_size * height / width;
    imageWidth = max_size;
  }
  else if (height > max_size) {
    imageHeight = max_size * width / height;
    imageWidth = max_size;
  }

  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      imageWidth,
      imageHeight,
      'JPEG',
      100,
      0,
      (uri) => {
        resolve(uri);
      },
      'file',
    );
  });
};
