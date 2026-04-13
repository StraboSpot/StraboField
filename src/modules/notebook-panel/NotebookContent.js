import React, {useEffect} from 'react';
import {FlatList, KeyboardAvoidingView, Platform, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import NotebookFooter from './notebook-footer/NotebookFooter';
import NotebookHeader from './notebook-header/NotebookHeader';
import {setNotebookPageVisible} from './notebook.slice';
import notebookStyles from './notebook.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setModalVisible} from '../home/home.slice';
import Overview from '../page/Overview';
import {NOTEBOOK_PAGES, SUBPAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import usePage from '../page/usePage';
import {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';
import useProject from '../project/useProject';
import {SpotsListItem, useSpots} from '../spots';

const NotebookContent = ({closeNotebookPanel, createDefaultGeom, openMainMenuPanel, zoomToSpots}) => {
  console.log('Rendering NotebookContent...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getPopulatedPagesKeys, getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();
  const {isSpotInReadOnlyDataset} = useProject();
  const {getActiveSpotsObj, getRecentSpots, getRootSpot, handleSpotSelected, sortSpotsByDateCreated} = useSpots();

  /* Derived Variables */

  const isReadOnly = !isEmpty(spot) && isSpotInReadOnlyDataset(spot.properties.id);
  const pageVisible = pagesStack.slice(-1)[0];

  /* Side Effects */

  useEffect(() => {
    console.log('UE NotebookContent [pageVisible, spot]', pageVisible, spot);
    if (isMultipleFeaturesTaggingEnabled) dispatch(setMultipleFeaturesTaggingEnabled(false));
    const isRelevantPage = pageVisible === PAGE_KEYS.OVERVIEW
      || getRelevantGeneralPages().map(p => p.key).includes(pageVisible)
      || getRelevantPetPages().map(p => p.key).includes(pageVisible)
      || getRelevantSedPages().map(p => p.key).includes(pageVisible)
      || SUBPAGES.map(p => p.key).includes(pageVisible);
    if (!isRelevantPage) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  }, [pageVisible, spot]);

  /* Logic Helpers */

  const openPage = (key) => {
    dispatch(setNotebookPageVisible(key));
    const page = NOTEBOOK_PAGES.find(p => p.key === key);
    if (SMALL_SCREEN || isReadOnly) dispatch(setModalVisible({modal: null}));
    else if (page.modal_component) {
      const populatedPagesKeys = getPopulatedPagesKeys(spot);
      if (populatedPagesKeys.includes(page.key)) dispatch(setModalVisible({modal: null}));
      else dispatch(setModalVisible({modal: page.key}));
    }
    else dispatch(setModalVisible({modal: null}));
  };

  /* Render Functions */

  const renderNotebookContent = () => {
    const page = NOTEBOOK_PAGES.find(p => p.key === pageVisible);
    const Page = page?.page_component || Overview;
    let pageProps = {isReadOnly: isReadOnly, openMainMenuPanel: openMainMenuPanel, page: page};
    if (page?.key === PAGE_KEYS.IMAGES) pageProps = {...pageProps};
    return (
      <>
        <View style={notebookStyles.headerContainer}>
          <NotebookHeader
            closeNotebookPanel={closeNotebookPanel}
            createDefaultGeom={createDefaultGeom}
            isReadOnly={isReadOnly}
            openMainMenuPanel={openMainMenuPanel}
            zoomToSpots={zoomToSpots}
          />
        </View>
        <KeyboardAvoidingView
          behavior={'padding'}
          enabled={Platform.OS === 'ios'}
          style={{...notebookStyles.centerContainer}}
        >
          <Page {...pageProps}/>
        </KeyboardAvoidingView>
        <View style={notebookStyles.footerContainer}>
          <NotebookFooter openPage={openPage}/>
        </View>
      </>
    );
  };

  const renderNotebookContentNoSpot = () => {
    return (
      <View style={notebookStyles.centerContainer}>
        {renderRecentSpotsList()}
      </View>
    );
  };

  const renderParentSpot = () => {
    const parentSpot = getRootSpot(currentImageBasemap.id);
    return (
      <View style={{justifyContent: 'flex-start'}}>
        <SectionDivider dividerText={'Parent Spot'}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No Parent Spot Found'}/>}
          data={[parentSpot]}
          keyExtractor={item => item?.properties?.id?.toString()}
          renderItem={({item}) => (
            <SpotsListItem
              doShowTags={true}
              onPress={() => handleSpotSelected(item)}
              spot={item}
            />
          )}
        />
      </View>
    );
  };

  const renderRecentSpotsList = () => {
    let spotsList = getRecentSpots();
    if (isEmpty(spotsList)) {
      const activeSpotsObj = getActiveSpotsObj();
      const activeSpots = Object.values(activeSpotsObj);
      spotsList = sortSpotsByDateCreated(activeSpots);
    }

    return (
      <View style={notebookStyles.centerContainer}>
        {currentImageBasemap && renderParentSpot()}
        <SectionDivider dividerText={'Recent Spots'}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No Spots in Visible Datasets'}/>}
          data={spotsList}
          keyExtractor={item => item.properties.id.toString()}
          renderItem={({item}) => (
            <SpotsListItem
              doShowTags={true}
              onPress={() => handleSpotSelected(item)}
              spot={item}
            />
          )}
        />
        {!SMALL_SCREEN && (
          <ClearButton
            onPress={closeNotebookPanel}
            title={'Close Notebook'}
          />
        )}
      </View>
    );
  };

  /* View */

  return isEmpty(spot) ? renderNotebookContentNoSpot() : renderNotebookContent();
};

export default NotebookContent;
