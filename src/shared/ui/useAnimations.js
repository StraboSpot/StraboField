import Assets from '../../assets/lottie-animations';

const useAnimations = () => {
  /* Exported Functions */

  const getAnimationType = (type) => {
    switch (type) {
      case 'uploading':
        return Assets.lottieFiles.uploading;
      case 'uploadingCloud':
        return Assets.lottieFiles.uploadingCloud;
      case 'complete':
        return Assets.lottieFiles.uploadingComplete;
      case 'deleteProject' :
        return Assets.lottieFiles.fileDelete;
      case 'error' :
        return Assets.lottieFiles.error;
      case 'loadingFile' :
        return Assets.lottieFiles.loadingFile;
    }
  };

  return {
    getAnimationType,
  };
};

export default useAnimations;
