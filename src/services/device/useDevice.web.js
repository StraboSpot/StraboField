import {Linking} from 'react-native';

const useDevice = () => {
  /* Exported Functions */

  const openURL = async (url) => {
    const initialUrl = await Linking.canOpenURL(url);
    console.log(initialUrl);
    if (initialUrl) Linking.openURL(url).catch(err => console.error('ERROR', err));
    else console.log('Could not open:', url);
  };

  return {
    openURL,
  };
};

export default useDevice;
