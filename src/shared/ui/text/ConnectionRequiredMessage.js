import React from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

import {getConnectionTargetText} from '../../../modules/connections/useConnectionStatus';
import commonStyles from '../../common.styles';
import uiStyles from '../ui.styles';

const ConnectionRequiredMessage = ({actionText, isInternetRequired = false, style}) => {
  /* Data Hooks */
  const isEndpointSelected = useSelector(state => state.connections.databaseEndpoint.isSelected);

  /* Derived Variables */
  const connectToText = getConnectionTargetText({isEndpointSelected, isInternetRequired});

  /* View */

  return (
    <Text style={[commonStyles.importantText, uiStyles.spacer, style]}>
      Please connect to {connectToText} to {actionText}.
    </Text>
  );
};

export default ConnectionRequiredMessage;
