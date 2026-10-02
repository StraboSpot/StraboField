import {useSelector} from 'react-redux';

import useMicroZips from './useMicroZips';
import useDevice from '../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import useServerRequests from '../../services/network/useServerRequests';

const useMicro = () => {
  /* Data Hooks */

  const isInternetReachable = useSelector(state => state.connections.isOnline.isInternetReachable);

  const {
    doesMicroProjectPDFExist,
    getMicroProjectName,
    getSavedMicroProjectModifiedTimestamp,
    readDirectory,
  } = useDevice();
  const {downloadZip} = useMicroZips();
  const {getMyMicroProjects} = useServerRequests();

  /* Internal Functions */

  // A failed check counts as not newer, so it never holds back the saved copy
  const isServerMicroProjectNewer = async (projectId) => {
    try {
      const serverProject = (await getMyMicroProjects())?.projects
        ?.find(project => String(project.id) === String(projectId));
      const savedModifiedTimestamp = await getSavedMicroProjectModifiedTimestamp(projectId);
      return !!savedModifiedTimestamp && serverProject?.modifiedtimestamp > savedModifiedTimestamp;
    }
    catch (err) {
      console.error('Error checking for a newer StraboMicro project', err);
      return false;
    }
  };

  /* Exported Functions */

  // Download a StraboMicro project if its PDF isn't on the device, or is out of date and the device is online, and
  // give back the PDF to open. A saved copy is still opened if its update fails.
  const downloadMicroProjectIfMissingOrOutdated = async (projectId) => {
    const hasSavedCopy = await doesMicroProjectPDFExist(projectId);
    if (!hasSavedCopy || (isInternetReachable && await isServerMicroProjectNewer(projectId))) {
      try {
        await downloadZip(projectId, projectId);
      }
      catch (err) {
        if (!hasSavedCopy) throw err;
        console.error('Error updating StraboMicro project', err);
      }
    }
    return getMicroProjectPDFDoc(projectId, await getMicroProjectName(projectId));
  };

  const getAllLocalMicroProjects = async () => {
    const localMicroProjects = await readDirectory(APP_DIRECTORIES.MICRO) || [];
    console.log('localMicroProjects', localMicroProjects);
    const projects = [];
    await Promise.all(localMicroProjects.map(async (projectId) => {
      if (projectId !== 'Zips') {
        const exists = await doesMicroProjectPDFExist(projectId);
        if (exists) {
          const name = await getMicroProjectName(projectId);
          projects.push({id: projectId, name: name});
        }
      }
    }));
    console.log('projects', projects);

    return {projects: projects};
  };

  const getAllServerMicroProjects = async () => {
    try {
      return await getMyMicroProjects();
    }
    catch (err) {
      return err.ok;
    }
  };

  // A StraboMicro project's PDF saved on the device, as MicroProjectPDFOverlay opens it
  const getMicroProjectPDFDoc = (projectId, name) => ({
    id: projectId,
    platform: ['ios', 'android'],
    label: 'StraboMicroProject',
    name: name,
    file: {uri: APP_DIRECTORIES.MICRO + projectId + '/' + 'project.pdf'},
  });

  return {
    downloadMicroProjectIfMissingOrOutdated,
    getAllLocalMicroProjects,
    getAllServerMicroProjects,
    getMicroProjectPDFDoc,
  };
};

export default useMicro;
