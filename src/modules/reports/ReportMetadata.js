import React from 'react';
import {Text, View} from 'react-native';

import {DARKGREY, SMALL_TEXT_SIZE} from '../../shared/styles.constants';

const metaStyle = {color: DARKGREY, fontSize: SMALL_TEXT_SIZE};

const ReportMetadata = ({createdBy, createdTimestamp, modifiedTimestamp}) => {
  /* Derived Variables */

  // A memo that predates authorship can still be dated from its id, so the author half is left off rather
  // than the whole line
  const createdLine = 'Created: ' + new Date(createdTimestamp).toLocaleString()
    + (createdBy ? ' by ' + createdBy : '');
  const modifiedLine = modifiedTimestamp ? 'Last modified: ' + new Date(modifiedTimestamp).toLocaleString() : null;

  /* View */

  // A memo never saved since created_timestamp existed has no date to show, and saveReport recovers one
  // from its id the next time it is saved
  if (!createdTimestamp) return null;

  return (
    <View style={{paddingHorizontal: 10, paddingBottom: 4}}>
      <Text style={metaStyle}>{createdLine}</Text>
      {modifiedLine && <Text style={metaStyle}>{modifiedLine}</Text>}
    </View>
  );
};

export default ReportMetadata;
