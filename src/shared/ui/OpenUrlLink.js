import React from 'react';
import {Linking} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {BLUE} from '../styles.constants';
import alert from './alert';

const OpenUrlLink = ({
                       buttonStyle,
                       color,
                       icon,
                       title,
                       titleStyle,
                       url,
                     }) => {

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

  return (
    <>
      {isOnline && (
        <Button
          buttonStyle={buttonStyle}
          title={title}
          titleStyle={titleStyle}
          type={'clear'}
          onPress={openLink}
          raised
          icon={
            <Icon
              name={icon}
              type={'ionicon'}
              iconStyle={{paddingHorizontal: 10}}
              size={20}
              color={color || BLUE}
            />
          }
        />
      )}
    </>
  );
};

export default OpenUrlLink;
