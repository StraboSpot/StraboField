import {useDispatch, useSelector} from 'react-redux';

import {getTagsToBackup, getTemplatesToBackup} from './files.helpers';
import {clearedStatusMessages} from '../../modules/home/home.slice';

// Web has no file system, so exports go through a browser download instead of being written to an export directory.
const downloadJson = (data, fileName) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Firefox cancels the download if the object URL is revoked in the same tick as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const useExport = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const projectDb = useSelector(state => state.project);

  /* Exported Functions */

  const backupTags = async (backupFileName, isGeologicUnits) => {
    const tagsToBackup = getTagsToBackup(projectDb.project?.tags, isGeologicUnits);
    console.log(isGeologicUnits ? 'Geologic Units' : 'Tags', 'to backup:', tagsToBackup);
    downloadJson(tagsToBackup, backupFileName + '.json');
    dispatch(clearedStatusMessages());
  };

  const backupTemplates = async (backupFileName) => {
    const templatesToBackup = getTemplatesToBackup(projectDb.project?.templates);
    console.log('Templates to backup:', templatesToBackup);
    downloadJson(templatesToBackup, backupFileName + '.json');
    dispatch(clearedStatusMessages());
  };

  return {
    backupTags,
    backupTemplates,
  };
};

export default useExport;
