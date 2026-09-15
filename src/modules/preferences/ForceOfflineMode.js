import React from 'react';
import {Platform, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import styles from './preferences.styles';
import commonStyles from '../../shared/common.styles';
import {SwitchWrapper} from '../../shared/ui';
import {setForceOffline} from '../connections/connections.slice';

// Dev-only preference: simulate no connection while staying connected to Metro/debugger.
// Native only — there is no offline mode on web.
const ForceOfflineMode = ({textStyles}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const isForceOffline = useSelector(state => state.connections.isForceOffline);

  /* Event Handlers */

  const onSwitchChange = value => dispatch(setForceOffline(value));

  /* View */

  if (!__DEV__ || Platform.OS === 'web') return null;

  return (
    <View style={[styles.rowContainer, {paddingHorizontal: 10, paddingVertical: 5}]}>
      <Text style={[commonStyles.listItemTitle, textStyles]}>
        Force Offline (dev)
      </Text>
      <SwitchWrapper
        onValueChange={onSwitchChange}
        value={isForceOffline}
      />
    </View>
  );
};

export default ForceOfflineMode;
