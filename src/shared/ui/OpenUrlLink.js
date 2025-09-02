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
          icon={
            <Icon
              color={color || BLUE}
              iconStyle={{paddingHorizontal: 10}}
              name={icon}
              size={20}
              type={'ionicon'}
            />
          }
          onPress={openLink}
          raised
          title={title}
          titleStyle={titleStyle}
          type={'clear'}
        />
      )}
    </>
  );
};

export default OpenUrlLink;
