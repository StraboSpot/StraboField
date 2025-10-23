import {Alert, Platform} from 'react-native';

const alertPolyfill = (title, description, options) => {
  const result = window.confirm([title, description].filter(Boolean).join('\n'));

  if (result && options) {
    console.log('OK pressed');
    const confirmOption = options.find(({style}) => style !== 'cancel');
    confirmOption && confirmOption.onPress && confirmOption.onPress();
  }
  else if (options) {
    console.log('Cancel pressed');
    const cancelOption = options.find(({style}) => style === 'cancel');
    cancelOption && cancelOption.onPress && cancelOption.onPress();
  }
};

const alert = (title, description, options, extra) => {
  Platform.OS === 'web' ? alertPolyfill(title, description, options, extra)
    : Alert.alert(title, description, options || [{text: 'Ok', onPress: () => console.log('OK Pressed')}]);
};

export default alert;
