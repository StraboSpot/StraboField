import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import styles from './issuesAndRequest.styles';
import UrlLinkButton from './UrlLinkButton';
import {SUPPORT_PATHS} from '../../services/urls.constants';
import {WHITE} from '../../shared/styles.constants';

const IssuesAndRequests = () => {

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  const message = isOnline ? 'Found a bug or want to suggest an improvement?\n'
    + '        You can report issues directly on GitHub (preferred method) or email our team!'
    : 'You must be online in order to submit an issue.';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🐞 Report an Issue</Text>
      <Text style={styles.description}>{message}</Text>
      <UrlLinkButton
        buttonStyle={styles.button}
        color={WHITE}
        icon={'logo-github'}
        title={'Open GitHub Issues'}
        titleStyle={styles.buttonText}
        url={SUPPORT_PATHS.GITHUB}
      />
      <UrlLinkButton
        buttonStyle={styles.button}
        color={WHITE}
        icon={'mail-outline'}
        title={'Email Support'}
        titleStyle={styles.buttonText}
        url={SUPPORT_PATHS.EMAIL}
      />
    </View>
  );
};

export default IssuesAndRequests;

