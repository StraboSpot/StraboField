import React, {forwardRef, useEffect, useMemo, useState} from 'react';

import MapboxGL from '@rnmapbox/maps';
import {useDispatch, useSelector} from 'react-redux';

import {
  CustomOverlayLayers,
  DrawLayers,
  EditLayers,
  FeaturesLayers,
  ImageBasemapLayer,
  MacrostratMarkerLayer,
  MeasureLayers,
} from '.';
import {setIsMapMoved} from '../maps.slice';
import CoveredIntervalsXLines from '../strat-section/CoveredIntervalsXLines';
import DraggedIntervalLayer from '../strat-section/DraggedIntervalLayer';
import StratSectionBackground from '../strat-section/StratSectionBackground';
import useMapView from '../useMapView';

const MapLayers = ({
                     basemap,
                     drawFeatures,
                     editFeatureVertex,
                     isShowMacrostratOverlay,
                     location,
                     mapMode,
                     measureFeatures,
                     showUserLocation,
                     spotsNotSelected,
                     spotsSelected,
                   }, cameraRef) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {currentImageBasemap, isDragIntervalMode, isMapMoved, stratSection} = useSelector(state => state.map);

  const {getInitialViewState} = useMapView();

  /* Local State */

  const [initialCenter, setInitialCenter] = useState([0, 0]);
  const [initialZoom, setInitialZoom] = useState();

  /* Derived State */

  const spotsDisplayed = useMemo(
    () => [...spotsNotSelected, ...spotsSelected],
    [spotsNotSelected, spotsSelected],
  );

  /* Side Effects */

  useEffect(() => {
      // console.log('UE Basemap');
      if (!isMapMoved) dispatch(setIsMapMoved(true));
      const {longitude, latitude, zoom} = getInitialViewState();
      console.log('Got initial center [' + longitude + ', ' + latitude + '] and zoom', zoom);
      setInitialCenter([longitude, latitude]);
      setInitialZoom(zoom);
    }, [currentImageBasemap, stratSection],
  );

  /* View */

  return (
    <>
      {/* Displays the marker when macrostrat view is displayed */}
      {isShowMacrostratOverlay && basemap.id === 'macrostrat' && <MacrostratMarkerLayer location={location}/>}

      {/* Blue dot for user location */}
      <MapboxGL.UserLocation
        animated={false}
        visible={!currentImageBasemap && !stratSection && showUserLocation}
      />

      <MapboxGL.Camera
        animationDuration={0}
        centerCoordinate={initialCenter}
        // followUserLocation={true}   // Can't follow user location if wanting to zoom to extent of Spots
        // followUserMode='normal'
        ref={cameraRef}
        zoomLevel={initialZoom}
      />

      {/* Custom Overlay Layer */}
      {!currentImageBasemap && !stratSection && <CustomOverlayLayers basemap={basemap}/>}

      {/* Strat Section Background Layer */}
      {stratSection && <StratSectionBackground/>}

      {/* Image Basemap Layer */}
      <ImageBasemapLayer/>

      {/* Features Layers */}
      <FeaturesLayers
        mapMode={mapMode}
        spotsNotSelected={spotsNotSelected}
        spotsSelected={spotsSelected}
      />

      {/* Draw Layer */}
      <DrawLayers drawFeatures={drawFeatures}/>

      {/* Edit Layer */}
      <EditLayers editFeatureVertex={editFeatureVertex}/>

      {/* Strat Section X Lines Layer for Covered/Uncovered or Not Measured Intervals */}
      {stratSection && <CoveredIntervalsXLines spotsDisplayed={spotsDisplayed}/>}

      {/* Dragged Interval Highlight Layer — orange fill + white border */}
      {stratSection && isDragIntervalMode && <DraggedIntervalLayer/>}

      {/* Measure Layer */}
      <MeasureLayers measureFeatures={measureFeatures}/>
    </>
  );
};

export default forwardRef(MapLayers);
