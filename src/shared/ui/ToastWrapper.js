import React from 'react';
import {Text, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {ToastProvider} from 'react-native-toast-notifications';

import styles from './ui.styles';

const ToastWrapper = ({children}) => {
  return (
    <ToastProvider
      animationDuration={500}
      duration={2000}
      normalColor={'black'}
      offset={50}
      placement={'center'}
      renderType={{
        noWifi: toast => (
          <View style={styles.toastContainer}>
            <Icon containerStyle={{paddingEnd: 10}} name={'wifi-off'}/>
            <Text>{toast.message}</Text>
          </View>
        ),
        lock: toast => (
          <View style={styles.toastContainer}>
            <Icon containerStyle={{paddingEnd: 10}} name={'lock'} size={35} type={'material-community'}/>
            <Text>{toast.message}</Text>
          </View>
        ),
        unlock: toast => (
          <View style={styles.toastContainer}>
            <Icon containerStyle={{paddingEnd: 10}} name={'lock-open'} size={35} type={'material-community'}/>
            <Text>{toast.message}</Text>
          </View>
        ),
      }}
      successIcon={
        <Icon
          color={'white'}
          name={'done'}
          size={25}
        />
      }
      swipeEnabled
      textStyle={{fontWeight: 'bold', paddingLeft: 5}}
      warningIcon={
        <Icon
          color={'white'}
          name={'error-outline'}
          size={25}
        />
      }
    >
      {children}
    </ToastProvider>
  );
};

export default ToastWrapper;
