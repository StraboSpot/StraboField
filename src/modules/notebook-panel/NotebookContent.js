import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import NotebookFooter from './notebook-footer/NotebookFooter';
import NotebookHeader from './notebook-header/NotebookHeader';
import {setNotebookPageVisible} from './notebook.slice';
import notebookStyles from './notebook.styles';
import {isEmpty, truncateText} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setModalVisible} from '../home/home.slice';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import mainMenuPanelStyles from '../main-menu-panel/mainMenuPanel.styles';
import Overview from '../page/Overview';
import {NOTEBOOK_PAGES, SUBPAGES} from '../page/page.constants';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import usePage from '../page/usePage';
import {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';
import SpotsList from '../spots/SpotsList';
import SpotsListItem from '../spots/SpotsListItem';
import useSpots from '../spots/useSpots';

const NotebookContent = ({closeNotebookPanel, createDefaultGeom, openMainMenuPanel, zoomToSpots}) => {
  console.log('Rendering NotebookContent...');

  /* Data Hooks */

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const isNotebookPanelVisible = useSelector(state => state.notebook.isNotebookPanelVisible);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const projectName = useSelector(state => state.project.project?.description?.project_name);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getAllRelevantPages, getPopulatedPagesKeys} = usePage();
  const {
    getRootSpot,
    getSpotWithThisImageBasemap,
    handleSpotSelected,
    isSpotReadOnly,
  } = useSpots();

  /* Local State */

  // The open sample form's current values, registered by the page that renders it so the footer's 'Add Data to
  // Sample' can carry the edits on screen into the sample it creates
  const getSampleValuesRef = useRef(null);

  const [selectedSample, setSelectedSample] = useState({});

  /* Derived Variables */

  const isReadOnly = isSpotReadOnly(spot);
  const isSample = !isEmpty(selectedSample) || spot.properties?.isSample;
  const spotWithThisImageBasemap = spot.properties?.image_basemap
    && getSpotWithThisImageBasemap(spot.properties.image_basemap);
  const isSampleOrSampleChild = isSample || spotWithThisImageBasemap?.properties?.isSample;
  const pageVisible = pagesStack.slice(-1)[0];

  /* Side Effects */

  useEffect(() => {
    console.log('UE NotebookContent [pageVisible, spot]', pageVisible, spot);
    if (isMultipleFeaturesTaggingEnabled) dispatch(setMultipleFeaturesTaggingEnabled(false));
    if (isNotebookPanelVisible && spot.properties?.isSample && isEmpty(spot.properties.samples)) {
      dispatch(setModalVisible({modal: MODAL_KEYS.NOTEBOOK.SAMPLES}));
    }
    const isRelevantPage = pageVisible === PAGE_KEYS.OVERVIEW
      || getAllRelevantPages().some(p => p.key === pageVisible)
      || SUBPAGES.some(p => p.key === pageVisible);
    if (!isRelevantPage) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    // A selected sample belongs to the Spot and page it was picked on, and isSample above reads it, so leaving it
    // set makes every later Spot render as that sample - parent row, sample name and all - long after it is gone.
    // SamplesPage keeps it right while it is the page showing, so only drop it off that page.
    if (pageVisible !== PAGE_KEYS.SAMPLES) setSelectedSample({});
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

  const openDatasetsPage = () => {
    dispatch(setSidePanelVisible({bool: false}));
    dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.MANAGE_PROJECT.DATASETS}));
    if (openMainMenuPanel) openMainMenuPanel();
  };

  /* Render Functions */

  const renderNotebookContent = () => {
    const page = NOTEBOOK_PAGES.find(p => p.key === pageVisible);
    const Page = page?.page_component || Overview;
    let pageProps = {isReadOnly: isReadOnly, isSample: isSample, openMainMenuPanel: openMainMenuPanel, page: page};
    if (page?.key === PAGE_KEYS.SAMPLES) {
      pageProps = {
        ...pageProps,
        registerGetValues: getSampleValuesRef,
        selectedSample: selectedSample,
        setSelectedSample: setSelectedSample,
      };
    }

    return (
      <>
        <View style={notebookStyles.headerContainer}>
          <NotebookHeader
            closeNotebookPanel={closeNotebookPanel}
            createDefaultGeom={createDefaultGeom}
            isReadOnly={isReadOnly}
            isSampleOrSampleChild={isSampleOrSampleChild}
            openMainMenuPanel={openMainMenuPanel}
            selectedSample={selectedSample}
            setSelectedSample={setSelectedSample}
            zoomToSpots={zoomToSpots}
          />
        </View>
        <View style={[{flex: 1}, isSampleOrSampleChild && notebookStyles.sampleBorder]}>
          <View style={notebookStyles.centerContainer}>
            <Page {...pageProps}/>
          </View>
          <NotebookFooter
            isRichSample={spot.properties?.isSample}
            openPage={openPage}
            registerGetValues={getSampleValuesRef}
            selectedSample={selectedSample}
          />
        </View>
      </>
    );
  };

  const renderNotebookContentNoSpot = () => {
    return (
      <View style={notebookStyles.centerContainer}>
        {renderSpotsList()}
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

  const renderSpotsList = () => {
    return (
      <View style={notebookStyles.centerContainer}>
        {currentImageBasemap && renderParentSpot()}
        <View style={mainMenuPanelStyles.mainMenuHeaderContainer}>
          <View style={{flex: 1, justifyContent: 'center'}}>
            <Text style={mainMenuPanelStyles.headerText}>{MAIN_MENU_ITEMS.PROJECT_DATA.SPOTS}</Text>
            <Text style={mainMenuPanelStyles.subheaderText}>
              Project: {truncateText(projectName, 22) || 'No Project Selected'}
            </Text>
          </View>
        </View>
        <SpotsList onPress={handleSpotSelected} openDatasetsPage={openDatasetsPage}/>
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
