// import './wdyr'; // <--- first import
import {AppRegistry} from 'react-native';

import FontAwesome from 'react-native-vector-icons/Fonts/FontAwesome.ttf';
import Ionicons from 'react-native-vector-icons/Fonts/Ionicons.ttf';
import MaterialCommunityIcons from 'react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf';
import MaterialIcons from 'react-native-vector-icons/Fonts/MaterialIcons.ttf';

import App from './App';

const IconsStyles = `
@font-face {
  src: url(${Ionicons});
  font-family: Ionicons;
}
@font-face {
  src: url(${MaterialIcons});
  font-family: MaterialIcons;
}
@font-face {
  src: url(${MaterialCommunityIcons});
  font-family: MaterialCommunityIcons;
}
@font-face {
  src: url(${FontAwesome});
  font-family: FontAwesome;
}
`;

const style = document.createElement('style');
style.type = 'text/css';

if (style.styleSheet) style.styleSheet.cssText = IconsStyles;
else style.appendChild(document.createTextNode(IconsStyles));

document.head.appendChild(style);

if (__DEV__ && module.hot) {
  module.hot.accept();
}

AppRegistry.registerComponent('StraboFieldWeb', () => App);
AppRegistry.runApplication('StraboFieldWeb', {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
