const useDeviceOrientation = () => {
  /* Exported Functions */

  const lockOrientation = () => {};

  const lockToPortrait = () => {};

  const lockToPortraitWhileOpen = async () => () => {};

  const unlockOrientation = () => {};

  return {
    lockOrientation,
    lockToPortrait,
    lockToPortraitWhileOpen,
    unlockOrientation,
  };
};

export default useDeviceOrientation;
