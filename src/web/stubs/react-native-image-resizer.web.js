// Web mock for @bam.tech/react-native-image-resizer
// On web, we don't actually resize images - just return the original

const ImageResizer = {
  createResizedImage: (uri, width, height, format, quality, rotation, outputPath) => {
    return Promise.resolve({
      uri: uri,
      path: uri,
      name: 'image.jpg',
      size: 0,
      width: width,
      height: height,
    });
  },
};

export default ImageResizer;