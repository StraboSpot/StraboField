import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';

import {useTags} from './index';
import {isEmpty} from '../../shared/Helpers';
import {NotebookPageAvatar} from '../../shared/ui/avatars';

function FeatureTagsList({
                           featureId,
                           spotId,
                         }) {
  /* Data Hooks */

  const {getTagsAtFeature} = useTags();

  /* Derived Variables */

  const tags = getTagsAtFeature(spotId, featureId);
  const tagsString = tags.map(tag => tag.name).sort().join(', ');

  /* View */

  return (
    <View>
      {!isEmpty(tagsString) && (
        <View style={{
          flexDirection: 'row',
          paddingTop: 5,
        }}>
          <NotebookPageAvatar pageKey={'tags'}/>
          <ListItem.Subtitle>{tagsString}</ListItem.Subtitle>
        </View>
      )}
    </View>
  );
}

export default FeatureTagsList;
