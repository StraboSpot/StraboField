import React from 'react';

import {Avatar} from '@rn-vui/base';

const AvatarWrapper = ({size, ...props}) => {
  return (
    <Avatar
      imageProps={{style: {height: size, width: size}}}
      size={size}
      {...props}
    >
      {props.children}
    </Avatar>
  );
};

export default AvatarWrapper;
