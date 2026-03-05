import {useState} from 'react';

import {unzip} from 'react-native-zip-archive';
import {useDispatch, useSelector} from 'react-redux';

import {APP_DIRECTORIES} from '../../services/directories.constants';
import {MICRO_PATHS, STRABO_APIS} from '../../services/urls.constants';
import useDevice from '../../services/useDevice';
import {addedStatusMessage, removedLastStatusMessage} from '../home/home.slice';

const useMicroZips = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const {deleteFromDevice, doesDeviceDirectoryExist, downloadAndSaveMap} = useDevice();

  /* Local State */

  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [percentDone, setPercentDone] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);

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
    setProjectName('');
  };

  const downloadZip = async (projectId, name) => {
    let lastLoggedPct = -1;
    setProjectName(name);
    setShowLoadingBar(true);
    setIsLoadingWave(true);
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
          setIsLoadingWave(false);
          dispatch(removedLastStatusMessage());
          dispatch(addedStatusMessage('Downloading...'));
          console.log(`Download started for "${name}" (jobId: ${jobId})`);
        },
        progress: (res) => {
          const pct = Math.floor((res.bytesWritten / res.contentLength) * 100);
          if (pct % 10 === 0 && pct > lastLoggedPct) {
            console.log('Download Zip Progress', pct + '%');
            lastLoggedPct = pct;
          }
          setPercentDone(prev => Math.max(prev, res.bytesWritten / res.contentLength));
        },
        discretionary: true,
      };

      await Promise.all([
        doesDeviceDirectoryExist(APP_DIRECTORIES.MICRO_ZIPS),
        doesDeviceDirectoryExist(APP_DIRECTORIES.MICRO),
      ]);
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
    projectName,
    showComplete,
    showLoadingBar,
  };
};

export default useMicroZips;
