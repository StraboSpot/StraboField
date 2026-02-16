import {useSelector} from 'react-redux';

import {isEmpty, truncateText} from '../../shared/Helpers';

const useUserProfile = () => {
  /* Data Hooks / State */

  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);
  const userData = useSelector(state => state.user);

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

  return {
    getEmail,
    getInitials,
    getName,
  };
};

export default useUserProfile;
