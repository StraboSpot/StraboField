import {useEffect, useRef} from 'react';
import {Linking, Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import {setMacrostratToken} from '../../../modules/user/userProfile.slice';

const MACROSTRAT_CALLBACK_ROUTES = ['macrostrat/login', 'macrostrat_login'];
const TOKEN_QUERY_KEYS = ['token', 'auth_token', 'access_token'];

const parseMacrostratCallback = (url) => {
  if (!url || typeof url !== 'string') return null;

  const [, remainder = ''] = url.split('://');
  const [pathAndQuery = ''] = remainder.split('#');
  const [route = '', queryString = ''] = pathAndQuery.split('?');
  const normalizedRoute = route.replace(/^\/+|\/+$/g, '');
  const matchingRoute = MACROSTRAT_CALLBACK_ROUTES.find(callbackRoute =>
    normalizedRoute === callbackRoute || normalizedRoute.startsWith(`${callbackRoute}/`),
  );

  if (!matchingRoute) return null;

  const searchParams = new URLSearchParams(queryString);
  const tokenFromQuery = TOKEN_QUERY_KEYS.map(key => searchParams.get(key)).find(Boolean);
  if (tokenFromQuery) return {token: tokenFromQuery, url};

  const routeSegments = normalizedRoute.split('/').filter(Boolean);
  const matchingRouteSegments = matchingRoute.split('/').length;
  const tokenFromPath = routeSegments.slice(matchingRouteSegments).join('/');

  return tokenFromPath ? {token: decodeURIComponent(tokenFromPath), url} : {token: null, url};
};

const MacrostratAuthRedirectHandler = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const lastHandledUrlRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const handleUrl = ({url}) => {
      const callback = parseMacrostratCallback(url);
      if (!callback || callback.url === lastHandledUrlRef.current) return;

      lastHandledUrlRef.current = callback.url;

      if (!callback.token) {
        toast.show('Rockd login returned without a token.', {type: 'warning'});
        return;
      }

      dispatch(setMacrostratToken(callback.token));
      toast.show('Rockd login complete.', {type: 'success'});
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) handleUrl({url: initialUrl});
      })
      .catch(err => console.error('Error getting initial macrostrat auth URL', err));

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => subscription.remove();
  }, [dispatch, toast]);

  return null;
};

export default MacrostratAuthRedirectHandler;
