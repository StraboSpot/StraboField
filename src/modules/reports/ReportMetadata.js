import React from 'react';
import {Text, View} from 'react-native';

import {DARKGREY, SMALL_TEXT_SIZE} from '../../shared/styles.constants';

const metaStyle = {color: DARKGREY, fontSize: SMALL_TEXT_SIZE};

const ReportMetadata = ({createdBy, createdTimestamp, updatedTimestamp}) => {
  /* Derived Variables */

  const createdLine = [createdBy, new Date(createdTimestamp).toLocaleString()].filter(Boolean).join(' ');
  const updatedLine = updatedTimestamp ? 'Last updated: ' + new Date(updatedTimestamp).toLocaleString() : null;

  /* View */

  if (!createdTimestamp) return null;

  return (
    <View style={{paddingHorizontal: 10, paddingBottom: 4}}>
      <Text style={metaStyle}>{createdLine}</Text>
      {updatedLine && <Text style={metaStyle}>{updatedLine}</Text>}
    </View>
  );
};

export default ReportMetadata;
