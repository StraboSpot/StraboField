import {APP_DIRECTORIES} from '../../services/directories.constants';
import useDevice from '../../services/useDevice';
import useServerRequests from '../../services/useServerRequests';

const useMicro = () => {
  /* Data Hooks */

  const {doesMicroProjectPDFExist, getMicroProjectName, readDirectory} = useDevice();
  const {getMyMicroProjects} = useServerRequests();

  /* Exported Functions */

  const getAllLocalMicroProjects = async () => {
    const localMicroProjects = await readDirectory(APP_DIRECTORIES.MICRO);
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

  return {
    getAllLocalMicroProjects,
    getAllServerMicroProjects,
  };
};

export default useMicro;
