import SoundPlayer from 'react-native-sound-player';

const useCompassSound = () => {
  /* Exported Functions */

  const playCompassSound = () => {
    try {
      SoundPlayer.playAsset(require('../../assets/sounds/compass_button_click.mp3'));
      console.log('Successfully finished playing compass sound.');
    }
    catch (e) {
      console.log('Compass sound failed', e);
    }
  };

  return {
    playCompassSound,
  };

};

export default useCompassSound;
