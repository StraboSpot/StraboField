import React, {useMemo} from 'react';

import {useSelector} from 'react-redux';

import {
  CustomOverlayLayers,
  DrawLayers,
  EditLayers,
  FeaturesLayers,
  ImageBasemapLayer,
  MacrostratMarkerLayer,
  MeasureLayers,
} from '.';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import MapControlsContainer from '../controls/MapControlsContainer';
import CoveredIntervalsXLines from '../strat-section/CoveredIntervalsXLines';
import DraggedIntervalLayer from '../strat-section/DraggedIntervalLayer';
import SnapLineLayer from '../strat-section/SnapLineLayer';
import StratSectionBackground from '../strat-section/StratSectionBackground';

const MapLayers = ({
                     basemap,
                     drawFeatures,
                     editFeatureVertex,
                     isShowMacrostratOverlay,
                     location,
                     mapMode,
                     measureFeatures,
                     spotsNotSelected,
                     spotsSelected,
                   }) => {
  /* Data Hooks */

  const {currentImageBasemap, intervalDragState, isDragIntervalMode, stratSection} = useSelector(state => state.map);

  /* Derived State */

  const spotsDisplayed = useMemo(
    () => [...spotsNotSelected, ...spotsSelected],
    [spotsNotSelected, spotsSelected],
  );

  /* View */

  return (
    <>
      {/* Displays the marker when macrostrat view is displayed */}
      {isShowMacrostratOverlay && basemap.id === 'macrostrat' && <MacrostratMarkerLayer location={location}/>}

      {/* Small screens render this with the map action buttons instead, so it would double up here */}
      {!SMALL_SCREEN && <MapControlsContainer/>}

      {/* Custom Overlay Layer */}
      {!currentImageBasemap && !stratSection && <CustomOverlayLayers basemap={basemap}/>}

      {/* Strat Section Background Layer */}
      {stratSection && <StratSectionBackground/>}

      {/* Image Basemap Layer */}
      <ImageBasemapLayer/>

      {/* Features Layers */}
      <FeaturesLayers mapMode={mapMode} spotsNotSelected={spotsNotSelected} spotsSelected={spotsSelected}/>

      {/* Draw Layer */}
      <DrawLayers drawFeatures={drawFeatures}/>

      {/* Edit Layer */}
      <EditLayers editFeatureVertex={editFeatureVertex}/>

      {/* Strat Section X Lines Layer for Covered/Uncovered or Not Measured Intervals */}
      {stratSection && <CoveredIntervalsXLines spotsDisplayed={spotsDisplayed}/>}

      {/* Dragged Interval Highlight Layer — orange fill + white border */}
      {stratSection && isDragIntervalMode && <DraggedIntervalLayer/>}

      {/* Snap Line Layer — shown while dragging an interval */}
      {stratSection && intervalDragState && <SnapLineLayer/>}

      {/* Measure Layer */}
      <MeasureLayers measureFeatures={measureFeatures}/>
    </>
  );
};

export default MapLayers;
