import React from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

import issuesAndRequestsStyles from './issuesAndRequests.styles';
import {SUPPORT_PATHS} from '../../../services/network/urls.constants';
import URLLinkButton from '../../../shared/ui/buttons/URLLinkButton';
import FormFlatList from '../../form/FormFlatList';

const IssuesAndRequests = () => {
  /* Data Hooks */

  const isOnline = useSelector(state => state.connections.isOnline.isInternetReachable);

  /* Derived Variables */

  const message = isOnline ? 'Found a bug or want to suggest an improvement?\n'
    + '        You can report issues directly on GitHub (preferred method) or email our team!'
    : 'You must be online in order to submit an issue.';

  /* View */

  return (
    <FormFlatList style={issuesAndRequestsStyles.container}>
      <Text style={issuesAndRequestsStyles.header}>🐞 Report an Issue</Text>
      <Text style={issuesAndRequestsStyles.description}>{message}</Text>
      <URLLinkButton
        icon={'logo-github'}
        title={'Open GitHub Issues'}
        url={SUPPORT_PATHS.GITHUB}
      />
      <URLLinkButton
        icon={'mail-outline'}
        title={'Email Support'}
        url={SUPPORT_PATHS.EMAIL}
      />
    </FormFlatList>
  );
};

export default IssuesAndRequests;
