import React, {useEffect} from 'react';
import {FlatList, View} from 'react-native';

import {Button} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import NotebookFooter from './notebook-footer/NotebookFooter';
import NotebookHeader from './notebook-header/NotebookHeader';
import {setNotebookPageVisible} from './notebook.slice';
import notebookStyles from './notebook.styles';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {setModalVisible} from '../home/home.slice';
import Overview from '../page/Overview';
import {NOTEBOOK_PAGES, PAGE_KEYS, SUBPAGES} from '../page/page.constants';
import usePage from '../page/usePage';
import {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';
import {SpotsListItem, useSpots} from '../spots';

const NotebookContent = ({closeNotebookPanel, createDefaultGeom, openMainMenuPanel, zoomToSpots}) => {
  console.log('Rendering NotebookContent...');

  const dispatch = useDispatch();
  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const pagesStack = useSelector(state => state.notebook.visibleNotebookPagesStack);
  const recentlyViewedSpotIds = useSelector(state => state.spot.recentViews);
  const spot = useSelector(state => state.spot.selectedSpot);
  const spots = useSelector(state => state.spot.spots);

  const {getPopulatedPagesKeys, getRelevantGeneralPages, getRelevantPetPages, getRelevantSedPages} = usePage();
  const {getRootSpot, getSpotsSortedReverseChronologically, handleSpotSelected} = useSpots();

  const pageVisible = pagesStack.slice(-1)[0];

  useEffect(() => {
    console.log('UE NotebookContent [pageVisible, spot]', pageVisible, spot);
    if (isMultipleFeaturesTaggingEnabled) dispatch(setMultipleFeaturesTaggingEnabled(false));
  }, [pageVisible, spot]);

  const openPage = (key) => {
    dispatch(setNotebookPageVisible(key));
    const page = NOTEBOOK_PAGES.find(p => p.key === key);
    if (SMALL_SCREEN) dispatch(setModalVisible({modal: null}));
    else if (page.modal_component) {
      const populatedPagesKeys = getPopulatedPagesKeys(spot);
      if (populatedPagesKeys.includes(page.key)) dispatch(setModalVisible({modal: null}));
      else dispatch(setModalVisible({modal: page.key}));
    }
    else dispatch(setModalVisible({modal: null}));
  };

  const renderNotebookContent = () => {
    const isRelevantPage = pageVisible === PAGE_KEYS.OVERVIEW
      || getRelevantGeneralPages().map(p => p.key).includes(pageVisible)
      || getRelevantPetPages().map(p => p.key).includes(pageVisible)
      || getRelevantSedPages().map(p => p.key).includes(pageVisible)
      || SUBPAGES.map(p => p.key).includes(pageVisible);
    if (!isRelevantPage) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));

    let pageKey = isRelevantPage ? pageVisible : PAGE_KEYS.OVERVIEW;
    const page = NOTEBOOK_PAGES.find(p => p.key === pageKey);
    const Page = page?.page_component || Overview;
    let pageProps = {openMainMenuPanel: openMainMenuPanel, page: page};
    if (page.key === PAGE_KEYS.IMAGES) pageProps = {...pageProps};
    return (
      <>
        <View style={notebookStyles.headerContainer}>
          <NotebookHeader
            closeNotebookPanel={closeNotebookPanel}
            createDefaultGeom={createDefaultGeom}
            zoomToSpots={zoomToSpots}
          />
        </View>
        <View style={{...notebookStyles.centerContainer}}>
          <Page {...pageProps}/>
        </View>
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
    let spotsList = recentlyViewedSpotIds.reduce((obj, key) => {
      if (spots?.[key]) obj.push(spots[key]);
      return obj;
    }, []);
    if (isEmpty(spotsList)) spotsList = getSpotsSortedReverseChronologically();

    return (
      <View style={notebookStyles.centerContainer}>
        {currentImageBasemap && renderParentSpot()}
        <SectionDivider dividerText={'Recent Spots'}/>
        <FlatList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListEmptyComponent={<ListEmptyText text={'No Spots in Active Datasets'}/>}
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
          <Button
            onPress={closeNotebookPanel}
            title={'Close Notebook'}
            titleStyle={commonStyles.standardButtonText}
            type={'clear'}
          />
        )}
      </View>
    );
  };

  return isEmpty(spot) ? renderNotebookContentNoSpot() : renderNotebookContent();
};

export default NotebookContent;
