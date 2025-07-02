import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {ToastProvider, Toast} from 'react-native-toast-notifications';
import styles from './ui.styles';

const ToastPopup = ({children, onToastRef}) => {
  return (
    <ToastProvider
      placement={'center'}
      offset={50}
      animationDuration={500}
      duration={2000}
      swipeEnabled
      textStyle={{fontWeight: 'bold', paddingLeft: 5}}
      normalColor={'black'}
      successIcon={
        <Icon
          name={'done'}
          color={'white'}
          size={25}
        />
      }
      warningIcon={
        <Icon
          name={'error-outline'}
          color={'white'}
          size={25}
        />
      }
      renderType={{
        noWifi: toast => (
          <View style={styles.toastContainer}>
            <Icon name={'wifi-off'} containerStyle={{paddingEnd: 10}}/>
            <Text >{toast.message}</Text>
          </View>
        ),
        lock: toast => (
          <View style={styles.toastContainer}>
            <Icon type={'material-community'} name={'lock'} containerStyle={{paddingEnd: 10}} size={35}/>
            <Text>{toast.message}</Text>
          </View>
        ),
        unlock: toast => (
          <View style={styles.toastContainer}>
            <Icon type={'material-community'} name={'lock-open'} containerStyle={{paddingEnd: 10}} size={35}/>
            <Text>{toast.message}</Text>
          </View>
        ),
      }}
    >
      {children}
    </ToastProvider>
  );
};

export default ToastPopup;
