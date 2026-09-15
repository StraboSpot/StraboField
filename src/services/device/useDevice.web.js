import {Linking} from 'react-native';

const useDevice = () => {
  /* Exported Functions */

  const openURL = async (url) => {
    const initialUrl = await Linking.canOpenURL(url);
    console.log(initialUrl);
    if (initialUrl) Linking.openURL(url).catch(err => console.error('ERROR', err));
    else console.error('Could not open:', url);
  };

  const readDirectory = async () => [];

  return {
    openURL,
    readDirectory,
  };
};

export default useDevice;
