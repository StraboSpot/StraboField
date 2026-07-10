import React, {useMemo, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import BackupTagsModal from './BackupTagsModal';
import TagFilters from './filters/TagFilters';
import LoadTagsModal from './LoadTagsModal';
import {TAG_TYPES} from './tags.constants';
import TagsOverflowMenuModal from './TagsOverflowMenuModal';
import {isEmpty} from '../../shared/helpers';
import AddButton from '../../shared/ui/buttons/AddButton';
import UpdateSpotsInMapExtentButton from '../../shared/ui/UpdateSpotsInMapExtentButton';
import {setListFilters} from '../main-menu-panel/mainMenuPanel.slice';
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
  const listFilters = useSelector(state => state.mainMenu.listFilters);
  const tags = useSelector(state => state.project.project?.tags) || [];

  const useContinuousTagging = useSelector(state => state.project.project?.useContinuousTagging);

  /* Local State */

  const [isBackupTagsModalVisible, setIsBackupTagsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isLoadTagsModalVisible, setIsLoadTagsModalVisible] = useState(false);
  const [tagsSorted, setTagsSorted] = useState([]);

  /* Derived Variables */

  const pageKey = isGeologicUnits ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const page = PRIMARY_PAGES.find(p => p.key === pageKey);
  const label = page.label;
  const addButtonTitle = isGeologicUnits ? 'Create New Geologic Unit' : 'Create New Tag';

  // Each page (Tags/Geologic Units) keeps its own filter in Redux so selecting one doesn't affect the other.
  const selectedIndex = (listFilters && listFilters[pageKey]) || 0;

  /* Derived State */

  const baseTags = useMemo(() => isGeologicUnits ? tags.filter(t => t.type === PAGE_KEYS.GEOLOGIC_UNITS)
      : tags.filter(t => t.type !== PAGE_KEYS.GEOLOGIC_UNITS),
    [isGeologicUnits, tags],
  );

  /* Event Handlers */

  const handleContinuousTaggingSwitched = value => dispatch(setUseContinuousTagging(value));

  /* Logic Helpers */

  const addTag = () => {
    const newTag = isGeologicUnits ? {type: PAGE_KEYS.GEOLOGIC_UNITS} : {type: TAG_TYPES.CONCEPT};
    dispatch(setSelectedTag(newTag));
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => setIsDetailModalVisible(false);

  const setSelectedIndex = index => dispatch(setListFilters({page: pageKey, value: index}));

  /* View */

  return (
    <View style={{flex: 1}}>
      <AddButton onPress={addTag} title={addButtonTitle}/>
      {!isEmpty(tags) && (
        <>
          <TagFilters
            isGeologicUnits={isGeologicUnits}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            setTagsSorted={setTagsSorted}
            tags={baseTags}
          />
          {selectedIndex === 1 && (
            <UpdateSpotsInMapExtentButton
              title={`Update ${label} in Map Extent`}
              updateSpotsInMapExtent={updateSpotsInMapExtent}
            />
          )}
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
