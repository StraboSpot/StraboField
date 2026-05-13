import NetInfo from '@react-native-community/netinfo';
import {useDispatch} from 'react-redux';

import {setOnlineStatus} from '../connections/connections.slice';

const ConnectionStatus = () => {
  // console.log('Rendering ConnectionStatus...');

  const dispatch = useDispatch();

  // NetInfo.configure(
  //   reachabilityUrl: 'https://clients3.google.com/generate_204',
  //   reachabilityTest: async (response) => {
  //     // console.log('Response Status', response.status);
  //     return response.status === 204;
  //   },
  //   reachabilityLongTimeout: 5 * 1000, // 60s
  //   reachabilityShortTimeout: 5 * 1000, // 5s
  //   reachabilityRequestTimeout: 15 * 1000, // 15s
  // });

  // Subscribe
  NetInfo.addEventListener((state) => {
    // console.log('Checking Connection Status...');
    // console.log('Is connected?', state.isConnected, '- Connection type:', state.type);
    if (state.isInternetReachable !== null && state.isConnected !== null) dispatch(setOnlineStatus(state));
  });
};

export default ConnectionStatus;
