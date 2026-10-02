import React from 'react';
import {ScrollView, Text, View} from 'react-native';

import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';

// What StraboMicro or StraboExperimental holds for a linked sample, shown read only. It is that app's own payload,
// with no form to lay it out, so it is shown as it comes: each value under its key, and anything nested under a
// heading of its own.
const LinkedSampleDataView = ({data}) => {
  /* Logic Helpers */

  // A key ending in id is split before it, so sampleid reads as Sample Id
  const getKeyLabel = key => toTitleCase(String(key).replace(/_/g, ' ').replace(/(\w)id$/i, '$1 id'));

  /* Render Functions */

  const renderEntry = ([key, value], depth) => {
    if (isEmpty(value)) return null;
    if (typeof value === 'object') {
      return (
        <View key={key} style={{paddingLeft: depth > 0 ? 10 : 0}}>
          <SectionDivider dividerText={getKeyLabel(key)}/>
          {renderEntries(value, depth + 1)}
        </View>
      );
    }
    return (
      <Text key={key} style={[commonStyles.listItemTitle, {paddingHorizontal: 10, paddingVertical: 2}]}>
        <Text style={{fontWeight: 'bold'}}>{getKeyLabel(key)}: </Text>{String(value)}
      </Text>
    );
  };

  // An array's items are numbered from 1, as a reader counts them
  const renderEntries = (value, depth) => Object.entries(value)
    .map(([key, v]) => renderEntry([Array.isArray(value) ? Number(key) + 1 : key, v], depth));

  /* View */

  if (isEmpty(data)) return <ListEmptyText text={'No data'}/>;

  return (
    <ScrollView contentContainerStyle={{paddingBottom: 200, paddingTop: 5}}>
      {typeof data === 'object' ? renderEntries(data, 0) : renderEntry(['value', data], 0)}
    </ScrollView>
  );
};

export default LinkedSampleDataView;
