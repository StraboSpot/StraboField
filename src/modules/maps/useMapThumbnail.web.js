import useMapURL from './useMapURL';

const useMapThumbnail = () => {
  /* Data Hooks */

  const {buildThumbnailTileURL} = useMapURL();

  /* Exported Functions */

  // Nothing is saved on web, so there is nothing to clean up after
  const deletePreviousThumbnail = async () => {};
  const deleteThumbnail = async () => {};
  const getKeptThumbnailUri = async () => {};

  // Web has nowhere of its own to keep a tile, so a thumbnail is drawn from its live URL and whatever the
  // browser's cache decides to hold on to. Kept async to match the native hook, which reads from the device.
  const getThumbnailUri = async map => buildThumbnailTileURL(map);

  return {
    deletePreviousThumbnail,
    deleteThumbnail,
    getKeptThumbnailUri,
    getThumbnailUri,
  };
};

export default useMapThumbnail;
