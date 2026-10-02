import {useDispatch, useSelector} from 'react-redux';

import {updatedKey} from './userProfile.slice';
import useServerRequests from '../../services/network/useServerRequests';
import {isEmpty, truncateText} from '../../shared/helpers';

// Shared by every caller while in flight, so a list of linked rows makes one request
let userIdRequest = null;

const useUserProfile = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const userData = useSelector(state => state.user);

  const {getProfile} = useServerRequests();

  /* Exported Functions */

  const getEmail = () => {
    return !customDatabaseEndpoint.isSelected && !isEmpty(userData.email) && truncateText(userData.email, 16);
  };

  const getInitials = () => {
    return userData?.name?.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  const getName = () => {
    let name = '';
    if (customDatabaseEndpoint.isSelected && !isEmpty(userData.name)) name = userData.name.split(' ')[0];
    else !isEmpty(userData.name) ? name = userData.name : 'Guest';
    return name;
  };

  // A profile saved before the server began sending straboUserId lacks it, so fetch it again. Undefined for a guest
  // or if the request fails.
  const getStraboUserId = async () => {
    if (!isEmpty(userData.straboUserId)) return userData.straboUserId;
    if (isEmpty(userData.encoded_login)) return undefined;
    if (!userIdRequest) {
      userIdRequest = getProfile(userData.encoded_login)
        .then((profile) => {
          if (!isEmpty(profile?.straboUserId)) dispatch(updatedKey({straboUserId: profile.straboUserId}));
          return profile?.straboUserId;
        })
        .catch((err) => {
          console.error('Error getting the user profile', err);
          return undefined;
        })
        .finally(() => {
          userIdRequest = null;
        });
    }
    return userIdRequest;
  };

  return {
    getEmail,
    getInitials,
    getName,
    getStraboUserId,
  };
};

export default useUserProfile;
