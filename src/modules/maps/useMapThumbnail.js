import {getTileFolderName} from './offline-maps/offlineMaps.helpers';
import useMapURL from './useMapURL';
import useDevice from '../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';

const useMapThumbnail = () => {
  /* Data Hooks */

  const {deleteFromDevice, doesFileExist, downloadAndSaveMap, makeDirectory} = useDevice();
  const {buildThumbnailTileURL} = useMapURL();

  /* Internal Functions */

  // Named for the map and nothing else, so a map has one thumbnail by construction rather than by being tidied
  // up after. A map that is re-mapped over a different area keeps showing the first tile saved for it: which
  // place a thumbnail is of matters far less than that it is there, and the alternative is throwing away a good
  // picture to fetch another whenever an extent shifts.
  const getThumbnailPath = map => APP_DIRECTORIES.TILE_THUMBNAILS + getTileFolderName(map.id, map.source) + '.png';

  /* Exported Functions */

  const deleteThumbnail = async (map) => {
    const filePath = getThumbnailPath(map);
    if (await doesFileExist(filePath)) await deleteFromDevice(filePath);
  };

  // A map saved under a new id leaves its thumbnail behind named for the old one, which nothing looks for again.
  // Left alone where the name has not actually moved: a Mapbox style re-created under a different account keeps
  // the same one, so what is saved there belongs to the map still using it. Mirrors renameOfflineMapTiles.
  const deletePreviousThumbnail = async (previousId, map) => {
    if (getTileFolderName(previousId, map.source) === getTileFolderName(map.id, map.source)) {
      console.log('Thumbnail name is unchanged, only the Mapbox account moved. Nothing left behind.');
      return;
    }
    await deleteThumbnail({...map, id: previousId});
  };

  // The thumbnail already kept for a map, if it has one, without going to the network for it. A map downloaded
  // to the device is named for the same folder as the custom map it was saved from, so this finds the picture
  // it showed while online and it looks the same offline.
  const getKeptThumbnailUri = async (map) => {
    const filePath = getThumbnailPath(map);
    if (await doesFileExist(filePath)) return 'file://' + filePath;
  };

  // The tile a custom map's thumbnail draws, kept on the device once it has been fetched. Worth keeping because
  // the tile server sends no caching headers at all - no max-age, no ETag - so nothing downstream holds on to a
  // tile, and the map layers list fetches one per custom map every time it is opened. The whole tile is saved
  // rather than only the part shown: the thumbnail crops when it draws, so trimming the file would need an image
  // editor to save a few kilobytes of a device's storage.
  const getThumbnailUri = async (map) => {
    const tileUrl = buildThumbnailTileURL(map);
    if (!tileUrl) return;
    const keptThumbnailUri = await getKeptThumbnailUri(map);
    if (keptThumbnailUri) return keptThumbnailUri;
    const filePath = getThumbnailPath(map);
    await makeDirectory(APP_DIRECTORIES.TILE_THUMBNAILS);
    await downloadAndSaveMap({fromUrl: tileUrl, toFile: filePath});
    return 'file://' + filePath;
  };

  return {
    deletePreviousThumbnail,
    deleteThumbnail,
    getKeptThumbnailUri,
    getThumbnailUri,
  };
};

export default useMapThumbnail;
