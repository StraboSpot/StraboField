import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import documentationStyles from './documentation.styles';
import {HELP_URL} from './help.constants';
import UrlLinkButton from './UrlLinkButton';

const Documentation = () => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  /* View */

  return (
    <View style={documentationStyles.container}>
      {isOnline && (
        <UrlLinkButton
          icon={'globe-outline'}
          title={'Online Help Page'}
          url={HELP_URL}
        />
      )}
    </View>
  );
};

export default Documentation;
