import React from 'react';
import {Pressable, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import TagColorIcon from './color/TagColorIcon';
import {tagsStyles} from './index';
import {TAG_ROCK_UNIT_FIELDS, TAG_SUBTYPE_FIELDS} from './tags.constants';
import useTags from './useTags';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';

const TagDetailSummaryText = ({onPress}) => {
  /* Data Hooks */
  const selectedTag = useSelector(state => state.project.selectedTag);
  const {getTagLabel} = useTags();

  /* Derived Variables */

  let type = selectedTag.type ? getTagLabel(selectedTag.type) : 'No type specified';
  if (selectedTag.type === 'other' && selectedTag.other_type) type = selectedTag.other_type;
  const notes = selectedTag.notes || undefined;
  let rockUnitString = TAG_ROCK_UNIT_FIELDS.reduce((acc, field) => {
    if (selectedTag[field]) return acc + (!isEmpty(acc) ? ' / ' : '') + selectedTag[field];
    else return acc;
  }, []);
  const subTypeField = TAG_SUBTYPE_FIELDS.find(subtype => selectedTag[subtype]);
  const subType = subTypeField ? getTagLabel(selectedTag[subTypeField]) : undefined;

  /* View */

  return (
    <Pressable onPress={onPress}>
      <View style={[tagsStyles.sectionContainer, {flexDirection: 'row', alignItems: 'flex-start', gap: 16}]}>
        <TagColorIcon color={selectedTag.color}/>
        <View style={{flex: 1}}>
          <Text style={commonStyles.listItemTitle}>{toTitleCase(type)}{subType && ' - ' + subType.toUpperCase()}</Text>
          {!isEmpty(rockUnitString) && <Text style={commonStyles.listItemSubtitle}>{rockUnitString}</Text>}
          {notes && <Text ellipsizeMode={'tail'} numberOfLines={3} style={commonStyles.listItemSubtitle}>
            Notes: {notes}
          </Text>}
        </View>
      </View>
    </Pressable>
  );
};

export default TagDetailSummaryText;
