import React from 'react';
import {View} from 'react-native';

import {useSelector} from 'react-redux';

import documentationStyles from './documentation.styles';
import UrlLinkButton from './UrlLinkButton';
import {STRABO_APIS} from '../../services/urls.constants';

const Documentation = () => {
  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const helpUrl = STRABO_APIS.STRABO + '/help';

  return (
    <View style={documentationStyles.container}>
      {isOnline && (
        <UrlLinkButton
          icon={'globe-outline'}
          title={'Online Help Page'}
          url={helpUrl}
        />
      )}
    </View>
  );
};

export default Documentation;
