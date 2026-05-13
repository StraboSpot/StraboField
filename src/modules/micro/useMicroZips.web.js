import {useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {MICRO_PATHS, STRABO_APIS} from '../../services/network/urls.constants';
import {addedStatusMessage, removedLastStatusMessage} from '../home/home.slice';

const useMicroZips = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  /* Local State */

  const [isLoadingWave, setIsLoadingWave] = useState(false);
  const [percentDone, setPercentDone] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [showLoadingBar, setShowLoadingBar] = useState(false);

  /* Exported Functions */

  const clearStatus = () => {
    setShowLoadingBar(false);
    setShowComplete(false);
    setIsLoadingWave(false);
    setPercentDone(0);
    setProjectName('');
  };

  const downloadZip = async (projectId, name) => {
    setProjectName(name);
    setShowLoadingBar(true);
    setIsLoadingWave(true);
    try {
      const zipUrl = STRABO_APIS.STRABO + MICRO_PATHS.PDF_PROJECT + '/' + projectId;
      dispatch(removedLastStatusMessage());
      dispatch(addedStatusMessage('Downloading...'));

      const response = await fetch(zipUrl, {headers: {'Authorization': 'Basic ' + user.encoded_login}});
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      setPercentDone(1);

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name + '.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setShowComplete(true);
    }
    catch (err) {
      throw new Error('Error Getting StraboMicro Project');
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
