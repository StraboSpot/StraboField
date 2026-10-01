import useMicroZips from './useMicroZips';
import useDevice from '../../services/device/useDevice';
import {APP_DIRECTORIES} from '../../services/files/directories.constants';
import useServerRequests from '../../services/network/useServerRequests';

const useMicro = () => {
  /* Data Hooks */

  const {doesMicroProjectPDFExist, getMicroProjectName, readDirectory} = useDevice();
  const {downloadZip} = useMicroZips();
  const {getMyMicroProjects} = useServerRequests();

  /* Exported Functions */

  // Download a StraboMicro project unless its PDF is already on the device, and give back the PDF to open
  const downloadMicroProjectIfMissing = async (projectId) => {
    if (!await doesMicroProjectPDFExist(projectId)) await downloadZip(projectId, projectId);
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
    downloadMicroProjectIfMissing,
    getAllLocalMicroProjects,
    getAllServerMicroProjects,
    getMicroProjectPDFDoc,
  };
};

export default useMicro;
