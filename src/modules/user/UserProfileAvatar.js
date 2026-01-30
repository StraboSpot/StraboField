import React, {useEffect, useState} from 'react';
import {Platform, View} from 'react-native';

import {useSelector} from 'react-redux';

import userStyles from './user.styles';
import useUserProfile from './useUserProfile';
import defaultAvatar from '../../assets/images/splash.png';
import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import {isEmpty} from '../../shared/Helpers';
import {AvatarAccessoryWrapper, AvatarWrapper} from '../../shared/ui/avatars';

const UserProfileAvatar = ({isEditable, openProfileImageModal, shouldUpdateImage, size, tempUserProfileImageURI}) => {
  const isOnline = useSelector(state => state.connections.isOnline);
  const imageURI = useSelector(state => state.user?.image);

  const {getInitials} = useUserProfile();
  const {doesFileExist} = useDevice();

  const [source, setSource] = useState(defaultAvatar);

  useEffect(() => {
    getAvatarSource();
  }, [tempUserProfileImageURI, shouldUpdateImage]);

  const getAvatarSource = async () => {
    console.log('tempUserProfileImageURI', tempUserProfileImageURI);
    if (Platform.OS === 'web') {
      if (!isEmpty(imageURI)) setSource({uri: imageURI});
      else if (getInitials()) setSource(undefined);
      else setSource(defaultAvatar);
    }
    else if (!isEditable && !isEmpty(tempUserProfileImageURI)) setSource({uri: tempUserProfileImageURI});
    else {
      const doesProfileImageExist = await doesFileExist(APP_DIRECTORIES.PROFILE_IMAGE);
      console.log('doesProfileImageExist', doesProfileImageExist);
      if (doesProfileImageExist) setSource({uri: 'file://' + APP_DIRECTORIES.PROFILE_IMAGE + '?' + new Date()}); // Avoid caching with date
      else if (!isEmpty(imageURI) && typeof imageURI.valueOf() === 'string') setSource({uri: imageURI});
      else if (getInitials()) setSource(undefined);
      else setSource(defaultAvatar);
    }
  };

  return (
    <AvatarWrapper
      containerStyle={{backgroundColor: 'darkgrey'}}
      rounded
      size={size}
      source={source}
      title={getInitials()}
      titleStyle={userStyles.avatarPlaceholderTitleStyle}
    >
      {isEditable && isOnline.isInternetReachable && Platform.OS !== 'web' && (
        <View>
          <AvatarAccessoryWrapper
            color={'grey'}
            iconStyle={{color: 'white'}}
            name={'pencil'}
            onPress={openProfileImageModal}
            reverse
            size={23}
            type={'font-awesome'}
          />
        </View>
      )}
    </AvatarWrapper>
  );
};

export default UserProfileAvatar;
