import React, {useState} from 'react';
import {FlatList} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import FeatureTagsAtSpotList from './FeatureTagsAtSpotList';
import SectionDivider from '../../shared/ui/SectionDivider';
import SectionDividerWithRightButton from '../../shared/ui/SectionDividerWithRightButton';
import {setModalVisible} from '../home/home.slice';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import {PAGE_KEYS} from '../page/page.constants';
import {addedTagToSelectedSpot} from '../project/projects.slice';
import {TagDetailModal, TagsAtSpotList} from '../tags';

const TagsNotebook = ({isReadOnly, openMainMenuPanel, page}) => {
  const dispatch = useDispatch();
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const firstDividerText = pageVisible !== PAGE_KEYS.GEOLOGIC_UNITS ? 'Spot Tags' : 'Geologic Units';

  const pageVisible = pagesStack.slice(-1)[0];

  const closeTagDetailModal = () => {
    setIsDetailModalVisible(false);
    dispatch(addedTagToSelectedSpot(false));
  };

  return (
    <>
      <NotebookPageHeader pageTitle={page.label}/>
      <FlatList
        ListFooterComponent={pageVisible !== PAGE_KEYS.GEOLOGIC_UNITS && (
          <>
            <SectionDivider dividerText={'Feature Tags'}/>
            <FeatureTagsAtSpotList openMainMenuPanel={openMainMenuPanel} page={page}/>
          </>
        )}
        ListHeaderComponent={
          <>
            {isReadOnly ? <SectionDivider dividerText={firstDividerText}/>
              : (
                <SectionDividerWithRightButton
                  buttonTitle={'Assign/Remove'}
                  dividerText={firstDividerText}
                  onPress={() => dispatch(setModalVisible({modal: pageVisible}))}
                />
              )}
              <TagsAtSpotList openMainMenuPanel={openMainMenuPanel} page={page}/>
          </>
        }
      />
      {isDetailModalVisible && <TagDetailModal closeModal={closeTagDetailModal}/>}
    </>
  );
};

export default TagsNotebook;
