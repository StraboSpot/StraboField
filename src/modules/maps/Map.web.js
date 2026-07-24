import React, {useCallback, useEffect, useState} from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';
import {Map as ReactMapGL, NavigationControl} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import useMapMouseActions from './interactions/useMapMouseActions.web';
import useMapMoveEvents from './interactions/useMapMoveEvents';
import {MapLayers} from './layers';
import {BACKGROUND, LAYER_IDS_NOT_SELECTED, LAYER_IDS_SELECTED, MAP_MODES, MAPBOX_TOKEN} from './maps.constants';
import {STRAT_PATTERNS} from './strat-section/stratSection.constants';
import {MAP_SYMBOLS} from './symbology/mapSymbology.constants';
import useMap from './useMap';
import useMapView from './useMapView';

const symbols = {...MAP_SYMBOLS, ...STRAT_PATTERNS};

// Pre-decode symbol images once so they can be added synchronously (before tiles parse) instead of async.
const symbolImageCache = {};
Object.entries(symbols).forEach(([id, url]) => {
  const img = new Image();
  img.onload = () => (symbolImageCache[id] = img);
  img.onerror = () => console.error('Error decoding symbol image:', id);
  img.src = url;
});

const Map = ({
               allowMapViewMove,
               basemap,
               drawFeatures,
               editFeatureVertex,
               handleMapLongPress,
               handleMapPress,
               isShowMacrostratOverlay,
               location,
               mapMode,
               mapRef,
               measureFeatures,
               onMapLoad,
               spotsNotSelected,
               spotsSelected,
               updateSpotsInMapExtent,
             }) => {
  // console.log('Rendering Map...');

  /* Data Hooks */

  const currentImageBasemap = useSelector(state => state.map.currentImageBasemap);
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const stratSection = useSelector(state => state.map.stratSection);

  const {isDrawMode} = useMap();
  const {cursor, handleMouseEnter, handleMouseLeave} = useMapMouseActions({editFeatureVertex, mapRef, mapMode});

  const [viewState, setViewState] = useState({});
  const {handleMapMoved} = useMapMoveEvents({setViewState, onMapMoveEnd: updateSpotsInMapExtent});
  const {getInitialViewState} = useMapView();

  /* Local State */
  const [mapKey, setMapKey] = useState(0);

  /* Derived Variables */

  // Track map ID changes to force re-render and prevent layer conflicts
  const currentMapId = currentImageBasemap ? currentImageBasemap.id : stratSection ? stratSection.strat_section_id : basemap.id;

  /* Derived State */

  // Add a symbol image to the style: sync from the cache, else async (warming the cache). No-op if present.
  const addSymbolImage = useCallback((map, id) => {
    if (!map || !symbols[id] || map.hasImage(id)) return;
    if (symbolImageCache[id]) {
      map.addImage(id, symbolImageCache[id]);
      return;
    }
    map.loadImage(symbols[id], (error, image) => {
      if (error) console.error('Error loading image:', id, error);
      else if (!map.hasImage(id)) {
        map.addImage(id, image);
        symbolImageCache[id] = image;
      }
    });
  }, []);

  // Add all symbol images and register the styleimagemissing backstop. Runs on styledata (not just load)
  // because switching to a strat section / image basemap swaps the style via setStyle(), which drops the
  // images without re-firing 'load'. styleimagemissing re-parses tiles for icons that missed the atlas.
  const ensureSymbolImages = useCallback((map) => {
    if (!map) return;
    if (!map._strabofieldImageMissingRegistered) {
      map._strabofieldImageMissingRegistered = true;
      map.on('styleimagemissing', e => addSymbolImage(map, e.id));
    }
    Object.keys(symbols).forEach(id => addSymbolImage(map, id));
  }, [addSymbolImage]);

  const handleMapLoad = useCallback(() => {
    ensureSymbolImages(mapRef.current);
    onMapLoad?.();
  }, [ensureSymbolImages, onMapLoad]);

  const handleStyleData = useCallback(e => ensureSymbolImages(e.target), [ensureSymbolImages]);

  /* Side Effects */

  useEffect(() => {
      // console.log('UE Map', viewState);
      // console.log('Dimensions', useDimensions);
      setViewState(getInitialViewState());
    }, [currentImageBasemap, stratSection],
  );

  useEffect(() => {
    // Force map re-render when map ID changes to prevent layer conflicts
    setMapKey(prev => prev + 1);
    console.log('Web Map ID changed to:', currentMapId);
  }, [currentMapId]);

  /* View */

  return (
    <ReactMapGL
      {...viewState}
      boxZoom={allowMapViewMove && !isDragIntervalMode}
      cursor={cursor}
      doubleClickZoom={!(isDrawMode(mapMode) || mapMode === MAP_MODES.EDIT)}
      dragPan={allowMapViewMove && !isDragIntervalMode}
      dragRotate={false}
      id={currentMapId}
      interactiveLayerIds={[...LAYER_IDS_NOT_SELECTED, ...LAYER_IDS_SELECTED]}
      key={`web-map-${mapKey}-${currentMapId}`}
      mapStyle={currentImageBasemap || stratSection ? BACKGROUND : basemap}
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={handleMapPress}
      onDblClick={handleMapLongPress}
      onLoad={handleMapLoad}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMoveEnd={handleMapMoved}   // Update spots in extent and saved view (center and zoom)
      onStyleData={handleStyleData}   // Re-add symbol images after setStyle (strat / image basemap swaps)
      pitchWithRotate={false}
      ref={mapRef}
      scrollZoom={allowMapViewMove && !isDragIntervalMode}
      style={{flex: 1}}
      styleDiffing={false}
      touchPitch={false}
      touchZoomRotate={false}
    >
      <NavigationControl
        position={'bottom-left'}
        showCompass={false}
        style={{bottom: 75, left: 10, position: 'absolute'}}
        visualizePitch={false}
      />
      <MapLayers
        basemap={basemap}
        drawFeatures={drawFeatures}
        editFeatureVertex={editFeatureVertex}
        isShowMacrostratOverlay={isShowMacrostratOverlay}
        location={location}
        mapMode={mapMode}
        measureFeatures={measureFeatures}
        spotsNotSelected={spotsNotSelected}
        spotsSelected={spotsSelected}
      />
    </ReactMapGL>
  );
};

export default Map;
