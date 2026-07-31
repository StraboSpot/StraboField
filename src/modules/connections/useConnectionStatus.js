import {useSelector} from 'react-redux';

// A custom endpoint needs only a network connection; otherwise the public Internet must be reachable.
const useIsConnectionAvailable = () => useSelector((state) => {
  const {isConnected, isInternetReachable} = state.connections.isOnline;
  return state.connections.databaseEndpoint.isSelected ? isConnected : isInternetReachable;
});

// Wording for what the user needs to connect to. isInternetRequired forces "the Internet" for features that
// always need it regardless of the endpoint (e.g. SESAR).
export const getConnectionTargetText = ({isEndpointSelected, isInternetRequired = false}) =>
  !isInternetRequired && isEndpointSelected ? 'your custom database endpoint' : 'the Internet';

export const useConnectionTargetText = () => {
  const isEndpointSelected = useSelector(state => state.connections.databaseEndpoint.isSelected);
  return getConnectionTargetText({isEndpointSelected});
};

export default useIsConnectionAvailable;
