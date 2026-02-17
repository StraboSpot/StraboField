/**
 * GlyphDownloader is an invisible component which handles downloading
 * Mapbox glyph ranges necessary to display SymbolLayers with text on
 * the map in offline mode.
 *
 * This is a hack to compensate for an issue where the Mapbox offline
 * manager does not download glyph ranges for a style by default. Issue
 * outlined here: https://github.com/react-native-mapbox-gl/maps/issues/1734
 * By displaying an invisible mapbox map with a SymbolLayer at an arbitrary coordinate,
 * we can force Mapbox to download glyph ranges necessary to display SymbolLayers
 * with text.
 */

import React from 'react';

import MapboxGL from '@rnmapbox/maps';

import {GLYPH_CENTER_COORDINATE, GLYPH_TEXT_SHAPE} from './maps.constants';

const GlyphDownloader = () => {
  /* Logic Helpers */

  // initMapboxErrorHandling();

  /* View */

  return (
    <MapboxGL.MapView
      style={{left: 0, top: 0, height: 50, width: 50, zIndex: -1, position: 'absolute', opacity: 0}}
    >
      <MapboxGL.Camera centerCoordinate={GLYPH_CENTER_COORDINATE}/>
      <MapboxGL.ShapeSource
        id={'glyph_downloader_shape_id'}
        shape={GLYPH_TEXT_SHAPE}
      >
        <MapboxGL.SymbolLayer
          id={'glyph_downloader_layer_id'}
          style={{textField: 'glyph_downloader_text'}}
        />
      </MapboxGL.ShapeSource>
    </MapboxGL.MapView>
  );
};

export default GlyphDownloader;
