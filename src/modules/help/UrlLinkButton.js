import React from 'react';
import {Linking} from 'react-native';

import {useSelector} from 'react-redux';

import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';

const UrlLinkButton = ({icon, title, url}) => {

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const openLink = async () => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else alert('Uh Oh!', `Can not open the url ${url}`);
    }
    catch (err) {
      console.error('Can\t open URL', err);
      alert(' Unable to open URL!');
    }
  };

  if (isOnline) {
    return (
      <OutlineButton
        icon={{
          color: PRIMARY_ACCENT_COLOR,
          iconStyle: {paddingRight: 10},
          name: icon,
          size: 20,
          type: 'ionicon',
        }}
        onPress={openLink}
        title={title}
      />
    );
  }
};

export default UrlLinkButton;
