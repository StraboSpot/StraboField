import React from 'react';
import {Pressable, Text} from 'react-native';

import commonStyles from '../../../shared/common.styles';
import useProject from '../useProject';

// Names the active datasets above a list drawn from them, so a record in a dataset that's switched off doesn't look
// missing. Pressing it opens the Datasets page, unless the list can't be left mid-edit and passes no openDatasetsPage.
const ActiveDatasetsSummary = ({countText, openDatasetsPage}) => {
  /* Data Hooks */

  const {getActiveDatasets} = useProject();

  /* Derived Variables */

  const activeDatasets = getActiveDatasets();
  let datasetsText = 'No Active Datasets';
  if (activeDatasets.length === 1) datasetsText = `Dataset: ${activeDatasets[0].name}`;
  else if (activeDatasets.length > 1) datasetsText = `Datasets: ${activeDatasets.map(d => d.name).join(', ')}`;
  const textStyle = [commonStyles.standardDescriptionText, {textAlign: 'center'}];

  /* View */

  return (
    <Pressable
      disabled={!openDatasetsPage}
      onPress={openDatasetsPage}
      style={{paddingBottom: 10, paddingHorizontal: 10}}
    >
      <Text numberOfLines={2} style={textStyle}>{datasetsText}</Text>
      {!!countText && <Text style={textStyle}>{countText}</Text>}
    </Pressable>
  );
};

export default ActiveDatasetsSummary;
