import React, {useMemo, useState} from 'react';
import {View} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import TagFilters from './filters/TagFilters';
import {TAG_TYPES} from './tags.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import AddButton from '../../shared/ui/buttons/AddButton';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';
import {PRIMARY_PAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedTag, setUseContinuousTagging} from '../project/projects.slice';
import {TagDetailModal, TagsList} from '../tags';
import BackupLoadTags from './BackupLoadTags';

const Tags = ({isGeologicUnits, type, updateSpotsInMapExtent}) => {
  console.log('Rendering Tags...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  /* Local State */

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tagsSorted, setTagsSorted] = useState([]);

  /* Derived Variables */

  const baseTags = useMemo(() => isGeologicUnits ? tags.filter(t => t.type === PAGE_KEYS.GEOLOGIC_UNITS)
      : tags.filter(t => t.type !== PAGE_KEYS.GEOLOGIC_UNITS),
    [isGeologicUnits, tags],
  );

  const pageKey = isGeologicUnits ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const page = PRIMARY_PAGES.find(p => p.key === pageKey);
  const label = page.label;

  /* Event Handlers */

  const handleContinuousTaggingSwitched = value => dispatch(setUseContinuousTagging(value));

  /* Logic Helpers */

  const addTag = () => {
    const newTag = isGeologicUnits ? {type: PAGE_KEYS.GEOLOGIC_UNITS} : {type: TAG_TYPES.CONCEPT};
    dispatch(setSelectedTag(newTag));
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const getButtonTitle = () => {
    if (isGeologicUnits) return ['Alphabetical', 'Map Extent'];
    return ['Categorized', 'Map Extent'];
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {!isReadOnlyProject && <AddButton onPress={addTag} title={`Create New ${toTitleCase(label).slice(0, -1)}`}/>}
      <BackupLoadTags isGeologicUnits={isGeologicUnits}/>
      {!isReadOnlyProject && (
        <ListItem containerStyle={commonStyles.listItem}>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>{`Continuous ${label}`}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper
            disabled={isReadOnlyProject}
            onValueChange={handleContinuousTaggingSwitched}
            value={useContinuousTagging}
          />
        </ListItem>
      )}
      {!isEmpty(tags) && (
        <>
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={getButtonTitle()}
            containerStyle={{height: 50}}
            onPress={index => setSelectedIndex(index)}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedIndex}
            textStyle={{fontSize: 12}}
          />
          {selectedIndex === 1 && (
            <UpdateSpotsInMapExtentButton
              title={`Update ${label} in Map Extent`}
              updateSpotsInMapExtent={updateSpotsInMapExtent}
            />
          )}
          <TagFilters isGeologicUnits={isGeologicUnits} setTagsSorted={setTagsSorted} tags={baseTags}/>
        </>
      )}
      <TagsList selectedIndex={selectedIndex} tagsSorted={tagsSorted} type={pageKey}/>

      {/* Modal */}
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
    </View>
  );
};

export default Tags;
