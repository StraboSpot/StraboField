import {useState} from 'react';

import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from '../../services/directories.constants';
import {MICRO_PATHS, STRABO_APIS} from '../../services/urls.constants';
import useDevice from '../../services/useDevice';
import {addedStatusMessage, removedLastStatusMessage} from '../home/home.slice';

const useMicroZips = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [percentDone, setPercentDone] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  const {doesDeviceDirectoryExist, downloadAndSaveMap} = useDevice();
  const {deleteFromDevice} = useDevice();

  /* Internal Functions */

  const doUnzip = async (projectId) => {
    try {
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Preparing to install tiles...'));
      const sourcePath = APP_DIRECTORIES.MICRO_ZIPS + projectId + '.zip';
      await unzip(sourcePath, APP_DIRECTORIES.MICRO);
      console.log('Unzip to', APP_DIRECTORIES.MICRO, 'completed');
      await deleteFromDevice(APP_DIRECTORIES.MICRO_ZIPS, projectId + '.zip');
      console.log('Zip', projectId, 'has been deleted.');
    }
    catch (err) {
      console.error('Unzip Error:', err);
      throw Error();
    }
  };

  /* Exported Functions */

  const clearStatus = () => {
    setShowLoadingBar(false);
    setShowComplete(false);
    setIsLoadingWave(false);
    setPercentDone(0);
  };

  const downloadZip = async (projectId) => {
    try {
      const downloadZipURL = STRABO_APIS.STRABO + MICRO_PATHS.PDF_PROJECT + '/' + projectId;
      const downloadOptions = {
        headers: {
          'Authorization': 'Basic ' + user.encoded_login,
          'Content-Type': 'application/json',
        },
        fromUrl: downloadZipURL,
        toFile: APP_DIRECTORIES.MICRO_ZIPS + projectId + '.zip',
        begin: (response) => {
          const jobId = response.jobId;
          setShowLoadingBar(true);
          setIsLoadingWave(false);
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('Downloading...'));
          console.log('DOWNLOAD HAS BEGUN! JobId: ' + jobId);
        },
        progress: (res) => {
          console.log('Download Zip Progress', ((res.bytesWritten / res.contentLength) * 100).toFixed(2));
          setPercentDone(res.bytesWritten / res.contentLength);
        },
        discretionary: true,
      };

      await doesDeviceDirectoryExist(APP_DIRECTORIES.MICRO_ZIPS);
      await doesDeviceDirectoryExist(APP_DIRECTORIES.MICRO);
      await downloadAndSaveMap(downloadOptions);
      await doUnzip(projectId);
      setShowComplete(true);
    }
    catch (err) {
      throw Error('Error Getting StraboMicro Project');
    }
    finally {
      setShowLoadingBar(false);
      setIsLoadingWave(false);
    }
  };

  return {
    clearStatus,
    downloadZip,
    isLoadingWave,
    percentDone,
    showComplete,
    showLoadingBar,
  };
};

export default useMicroZips;
