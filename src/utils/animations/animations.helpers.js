import Assets from '../../assets/lottie-animations';

const ANIMATIONS = {
  complete: Assets.lottieFiles.uploadingComplete,
  deleteProject: Assets.lottieFiles.fileDelete,
  error: Assets.lottieFiles.error,
  loadingFile: Assets.lottieFiles.loadingFile,
  uploading: Assets.lottieFiles.uploading,
  uploadingCloud: Assets.lottieFiles.uploadingCloud,
};

// Unknown types fall back to the generic loading animation rather than handing LottieView an undefined source.
export const getAnimationType = type => ANIMATIONS[type] || ANIMATIONS.loadingFile;
