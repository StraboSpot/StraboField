import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {Icon} from '@rn-vui/base';
import {ToastProvider} from 'react-native-toast-notifications';

import {MEDIUM_TEXT_SIZE} from '../styles.constants';
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
        undo: toast => (
          <View style={[styles.toastContainer, {paddingHorizontal: 16, paddingVertical: 12}]}>
            <Text style={{flexShrink: 1, fontSize: MEDIUM_TEXT_SIZE}}>{toast.message}</Text>
            <TouchableOpacity
              onPress={() => {
                toast.data?.onUndo?.();
                toast.onHide();
              }}
              style={{paddingHorizontal: 14}}
            >
              <Text style={{
                fontSize: MEDIUM_TEXT_SIZE,
                fontWeight: 'bold',
                textDecorationLine: 'underline',
              }}>{'UNDO'}</Text>
            </TouchableOpacity>
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
