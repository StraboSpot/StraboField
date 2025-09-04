import React from 'react';
import {Text, View} from 'react-native';

import styles from './issuesAndRequest.styles';
import UrlLinkButton from './UrlLinkButton';
import {SUPPORT_PATHS} from '../../services/urls.constants';
import {WHITE} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';

const IssuesAndRequests = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🐞 Report an Issue</Text>
      <Text style={styles.description}>
        Found a bug or want to suggest an improvement?
        You can report issues directly on GitHub (preferred method) or email our team.
      </Text>
      <UrlLinkButton
        buttonStyle={styles.button}
        color={WHITE}
        icon={'logo-github'}
        title={'Open GitHub Issues'}
        titleStyle={styles.buttonText}
        url={SUPPORT_PATHS.GITHUB}
      />
      <FlatListItemSeparator/>
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

