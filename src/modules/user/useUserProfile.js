import {useSelector} from 'react-redux';

import {isEmpty, truncateText} from '../../shared/Helpers';

const useUserProfile = () => {
  const userData = useSelector(state => state.user);
  const customDatabaseEndpoint = useSelector(state => state.connections.databaseEndpoint);

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
    getEmail: getEmail,
    getInitials: getInitials,
    getName: getName,
  };
};

export default useUserProfile;
