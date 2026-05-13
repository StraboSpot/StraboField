import React, {useMemo, useState} from 'react';
import {View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import BackupTagsModal from './BackupTagsModal';
import TagFilters from './filters/TagFilters';
import LoadTagsModal from './LoadTagsModal';
import {TAG_TYPES} from './tags.constants';
import TagsOverflowMenuModal from './TagsOverflowMenuModal';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';
import {PRIMARY_PAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {setSelectedTag, setUseContinuousTagging} from '../project/projects.slice';
import {TagDetailModal, TagsList} from '../tags';

const Tags = ({
                closeTagsOverflowMenu,
                isGeologicUnits,
                isOverflowMenuVisible = false,
                type,
                updateSpotsInMapExtent,
              }) => {
  console.log('Rendering Tags...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const tags = useSelector(state => state.project.project?.tags) || [];
  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  /* Local State */

  const [isBackupTagsModalVisible, setIsBackupTagsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isLoadTagsModalVisible, setIsLoadTagsModalVisible] = useState(false);
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

      {/* Menus and Modals */}
      <TagsOverflowMenuModal
        closeMenu={closeTagsOverflowMenu}
        isVisible={isOverflowMenuVisible}
        label={label}
        onAddPress={addTag}
        onBackupPress={() => setIsBackupTagsModalVisible(true)}
        onContinuousTaggingSwitched={handleContinuousTaggingSwitched}
        onLoadPress={() => setIsLoadTagsModalVisible(true)}
        useContinuousTagging={useContinuousTagging}
      />
      {isBackupTagsModalVisible && (
        <BackupTagsModal closeModal={() => setIsBackupTagsModalVisible(false)} isGeologicUnits={isGeologicUnits}/>
      )}
      {isDetailModalVisible && <TagDetailModal closeModal={closeDetailModal}/>}
      {isLoadTagsModalVisible && (
        <LoadTagsModal closeModal={() => setIsLoadTagsModalVisible(false)} isGeologicUnits={isGeologicUnits}/>
      )}
    </View>
  );
};

export default Tags;
