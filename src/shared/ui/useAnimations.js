import Assets from '../../assets/lottie-animations';

const useAnimations = () => {

  const getAnimationType = (type) => {
    switch (type) {
      case 'uploading':
        return Assets.lottieFiles.uploading;
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
    getAnimationType: getAnimationType,
  };
};

export default useAnimations;
