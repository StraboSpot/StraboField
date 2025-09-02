import React, {forwardRef, useEffect, useState} from 'react';

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
import StratSectionBackground from '../strat-section/StratSectionBackground';
import useMapView from '../useMapView';

const MapLayers = ({
                     basemap,
                     drawFeatures,
                     editFeatureVertex,
                     isShowMacrostratOverlay,
                     isStratStyleLoaded,
                     location,
                     measureFeatures,
                     showUserLocation,
                     spotsNotSelected,
                     spotsSelected,
                   }, cameraRef) => {

  const dispatch = useDispatch();
  const {currentImageBasemap, isMapMoved, stratSection} = useSelector(state => state.map);

  const [initialCenter, setInitialCenter] = useState([0, 0]);
  const [initialZoom, setInitialZoom] = useState();

  const {getInitialViewState} = useMapView();

  useEffect(() => {
      // console.log('UE Basemap');
      if (!isMapMoved) dispatch(setIsMapMoved(true));
      const {longitude, latitude, zoom} = getInitialViewState();
      console.log('Got initial center [' + longitude + ', ' + latitude + '] and zoom', zoom);
      setInitialCenter([longitude, latitude]);
      setInitialZoom(zoom);
    }, [currentImageBasemap, stratSection],
  );

  return (
    <>
      {/* Displays the marker when Macrostrat view is displayed */}
      {isShowMacrostratOverlay && basemap.id === 'macrostrat' && <MacrostratMarkerLayer location={location}/>}

      {/* Blue dot for user location */}
      <MapboxGL.UserLocation
        animated={false}
        visible={!currentImageBasemap && !stratSection && showUserLocation}
      />

      <MapboxGL.Camera
        centerCoordinate={initialCenter}
        ref={cameraRef}
        zoomLevel={initialZoom}
        animationDuration={0}
        // followUserLocation={true}   // Can't follow user location if wanting to zoom to extent of Spots
        // followUserMode='normal'
      />

      {/* Custom Overlay Layer */}
      {!currentImageBasemap && !stratSection && <CustomOverlayLayers basemap={basemap}/>}

      {/* Strat Section Background Layer */}
      {stratSection && <StratSectionBackground spotsDisplayed={[...spotsNotSelected, ...spotsSelected]}/>}

      {/* Image Basemap Layer */}
      <ImageBasemapLayer/>

      {/* Features Layers */}
      <FeaturesLayers
        isStratStyleLoaded={isStratStyleLoaded}
        spotsNotSelected={spotsNotSelected}
        spotsSelected={spotsSelected}
      />

      {/* Draw Layer */}
      <DrawLayers drawFeatures={drawFeatures}/>

      {/* Edit Layer */}
      <EditLayers editFeatureVertex={editFeatureVertex}/>

      {/* Strat Section X Lines Layer for Covered/Uncovered or Not Measured Intervals */}
      {stratSection && <CoveredIntervalsXLines spotsDisplayed={[...spotsNotSelected, ...spotsSelected]}/>}

      {/* Measure Layer */}
      <MeasureLayers measureFeatures={measureFeatures}/>
    </>
  );
};

export default forwardRef(MapLayers);
