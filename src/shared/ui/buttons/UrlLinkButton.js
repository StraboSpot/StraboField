import React from 'react';

import {useSelector} from 'react-redux';

import OutlineButton from './OutlineButton';
import {openUrl} from '../../helpers';
import {PRIMARY_ACCENT_COLOR} from '../../styles.constants';
import alert from '../alert';

const UrlLinkButton = ({color, icon, title, url}) => {

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const openLink = async () => {
    try {
      await openUrl(url);
    }
    catch (err) {
      console.error('Can\'t open URL', err);
      alert('Uh Oh!', `Can not open the url ${url}`);
    }
  };

  if (isOnline) {
    return (
      <OutlineButton
        icon={{
          color: color || PRIMARY_ACCENT_COLOR,
          name: icon,
          size: 20,
          type: 'ionicon',
        }}
        iconContainerStyle={{position: 'absolute', left: 15}}
        onPress={openLink}
        title={title}
      />
    );
  }
};

export default UrlLinkButton;
