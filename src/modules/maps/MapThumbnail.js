import React, {useEffect, useState} from 'react';
import {Image, Platform, View} from 'react-native';

import {Icon} from '@rn-vui/base';

import mapStyles from './maps.styles';
import useMapsOffline from './offline-maps/useMapsOffline';
import useMapThumbnail from './useMapThumbnail';
import {MEDIUMGREY, PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';

// Web has no local tile store, so a map there is never one downloaded to the device.
const isWeb = Platform.OS === 'web';

// One tile of the same place at the same zoom — z12/851/1556, the Dakota hogback southwest of Denver, where the
// plains meet the Front Range — for each default basemap, so the five are told apart by how each draws it rather
// than by where each is. A custom Mapbox style is drawn at that same tile too (see useMapURL), being another way
// of drawing the world rather than a map of somewhere, which is what lets it be compared against these five.
// Only the middle of a tile is ever seen, so what sits dead center is the whole choice, and the hogback puts
// tilted beds there: several units across the geology tile and a ridge for the hillshade, with a highway and a
// subdivision to keep the street maps and the imagery from being empty. Its roads are thin, which is the
// deliberate half of the trade - a town center draws roads better but is flat, so it costs the geology its color
// and the hillshade its relief. These five are bundled rather than fetched: they never change, a request per row
// is a cost on every provider and a breach of the usage policy of one of them, and a bundled tile looks the same
// offline as on. Every other map's tile is fetched once and kept by useMapThumbnail.
const DEFAULT_BASEMAP_THUMBNAILS = {
  'macrostrat': require('../../assets/images/basemaps/macrostrat.png'),
  'mapbox.outdoors': require('../../assets/images/basemaps/outdoors.png'),
  'mapbox.satellite': require('../../assets/images/basemaps/satellite.jpg'),
  'osm': require('../../assets/images/basemaps/osm.png'),
  'usgs.hillshade': require('../../assets/images/basemaps/hillshade.png'),
};

const MapThumbnail = ({isSelected, map}) => {
  /* Data Hooks */

  const {getThumbnailTilePath} = useMapsOffline();
  const {getKeptThumbnailUri, getThumbnailUri} = useMapThumbnail();

  /* Local State */

  const [isTileFailed, setIsTileFailed] = useState(false);
  const [offlineTileUrl, setOfflineTileUrl] = useState();
  const [savedTileUrl, setSavedTileUrl] = useState();

  /* Derived Variables */

  // A default basemap ships with its own tile, so it asks neither the network nor the device for one
  const bundledThumbnail = DEFAULT_BASEMAP_THUMBNAILS[map.id];
  // A map downloaded to this device can only show a tile that was actually downloaded, which its directory knows
  // and its stored extent does not, so that one is looked up rather than built.
  const isOfflineMap = !bundledThumbnail && !isWeb && !!map.sources?.['raster-tiles'];
  // What is left is a custom map served live, whose tile is fetched once and then kept
  const isSavedMap = !bundledThumbnail && !isOfflineMap;
  const tileUrl = bundledThumbnail ? undefined : (isOfflineMap ? offlineTileUrl : savedTileUrl);
  const isShowingTile = !!tileUrl && !isTileFailed;
  const imageSource = isShowingTile ? {uri: tileUrl} : bundledThumbnail;

  /* Side Effects */

  // A new tile deserves its own try, rather than staying on the icon because an earlier one could not be loaded
  useEffect(() => setIsTileFailed(false), [tileUrl]);

  // The thumbnail kept from when the map was online comes first, so a map looks the same with or without a
  // connection. Only a map never shown online falls back on a tile from its download.
  useEffect(() => {
    if (!isOfflineMap) return;
    getKeptThumbnailUri(map)
      .then(keptThumbnailUri => keptThumbnailUri || getThumbnailTilePath(map))
      .then(setOfflineTileUrl)
      .catch((err) => {
        console.error('Error getting a thumbnail tile for map', map.id, err);
        setOfflineTileUrl(undefined);
      });
  }, [isOfflineMap, map.id]);

  // Re-run on a changed extent, which is what a map with no thumbnail yet has been waiting for: its extent is
  // fetched after it is saved, and there is nowhere to point a tile at until it arrives. A map that cannot be
  // fetched - a private Mapbox style, a zoom a map has no tiles at, no connection - is shown as its map type.
  useEffect(() => {
    if (!isSavedMap) return;
    getThumbnailUri(map)
      .then(setSavedTileUrl)
      .catch((err) => {
        console.warn('No thumbnail tile for map', map.id, err);
        setSavedTileUrl(undefined);
      });
  }, [isSavedMap, map.id, map.bbox]);

  /* View */

  return (
    <View style={[mapStyles.thumbnail, isSelected && mapStyles.thumbnailSelected]}>
      {imageSource ? (
        <Image
          // Only a fetched tile can fail; a bundled one falling back on itself would loop
          onError={isShowingTile ? () => setIsTileFailed(true) : undefined}
          source={imageSource}
          style={mapStyles.thumbnailTile}
        />
      ) : (
        // Stands in for a map with no tile to show for itself: one with no stored extent, one whose tiles cannot
        // be reached, or one downloaded with nothing in its tile directory. The row already names the map type.
        <Icon
          color={isSelected ? PRIMARY_ACCENT_COLOR : MEDIUMGREY}
          name={'map-outline'}
          size={22}
          type={'ionicon'}
        />
      )}
    </View>
  );
};

export default MapThumbnail;
