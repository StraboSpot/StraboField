import {useEffect} from 'react';

import NetInfo from '@react-native-community/netinfo';
import {useDispatch, useSelector} from 'react-redux';

import {setOnlineStatus} from '../connections/connections.slice';

const ConnectionStatus = () => {
  // console.log('Rendering ConnectionStatus...');

  const dispatch = useDispatch();
  const isForceOffline = useSelector(state => state.connections.isForceOffline);

  // Subscribe
  useEffect(() => {
    // Dev-only: pretend we're offline while staying connected to Metro/debugger.
    // Toggle from Preferences > Miscellaneous > "Force Offline (dev)".
    if (__DEV__ && isForceOffline) {
      dispatch(setOnlineStatus({isConnected: false, isInternetReachable: false, type: 'none'}));
      return; // don't subscribe, so NetInfo can't overwrite the forced-offline state
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      // console.log('Checking Connection Status...');
      // console.log('Is connected?', state.isConnected, '- Connection type:', state.type);
      if (state.isInternetReachable !== null && state.isConnected !== null) dispatch(setOnlineStatus(state));
    });
    return unsubscribe;
  }, [dispatch, isForceOffline]);
};

export default ConnectionStatus;
