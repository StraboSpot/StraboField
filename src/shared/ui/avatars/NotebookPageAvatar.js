import React from 'react';

import {AvatarWrapper} from './';
import usePage from '../../../modules/page/usePage';

const NotebookPageAvatar = ({pageKey}) => {
  /* Data Hooks */

  const {getSpotDataIconSource} = usePage();

  /* View */

  return (
    <AvatarWrapper
      size={20}
      source={getSpotDataIconSource(pageKey)}
    />
  );
};

export default NotebookPageAvatar;
