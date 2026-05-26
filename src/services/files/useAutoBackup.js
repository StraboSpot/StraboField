import moment from 'moment';
import RNFS from 'react-native-fs';
import {useSelector} from 'react-redux';

import {APP_DIRECTORIES} from './directories.constants';
import {isEmpty} from '../../shared/helpers';
import useDevice from '../device/useDevice';

const MAX_AUTO_BACKUPS = 20;
const AUTO_BACKUP_PREFIX = 'AutoBackup_';
const SNAPSHOT_PREFIX = 'Snapshot_';

const useAutoBackup = () => {
  /* Data Hooks */

  const otherMapsDb = useSelector(state => state.map.customMaps);
  const projectDb = useSelector(state => state.project);
  const spotsDb = useSelector(state => state.spot.spots);

  const {deleteFromDevice, makeDirectory, writeFileToDevice} = useDevice();

  /* Exported Functions */

  const saveBackup = async (prefix) => {
    try {
      if (isEmpty(projectDb.project)) {
        console.log('Backup skipped: no active project.');
        return;
      }

      const backupDirExists = await RNFS.exists(APP_DIRECTORIES.BACKUP_DIR);
      if (!backupDirExists) await makeDirectory(APP_DIRECTORIES.BACKUP_DIR);

      if (prefix === AUTO_BACKUP_PREFIX) {
        const allItems = await RNFS.readdir(APP_DIRECTORIES.BACKUP_DIR);
        const autoBackups = allItems.filter(item => item.startsWith(AUTO_BACKUP_PREFIX)).sort();
        while (autoBackups.length >= MAX_AUTO_BACKUPS) {
          const oldest = autoBackups.shift();
          await deleteFromDevice(APP_DIRECTORIES.BACKUP_DIR + oldest);
          console.log('Auto backup pruned:', oldest);
        }
      }

      const projectName = (projectDb.project.description?.project_name || 'Unnamed').replace(/\s/g, '');
      const timestamp = moment(new Date()).format('YYYY-MM-DD_hmma');
      const folderName = prefix + timestamp + '_' + projectName;
      const folderPath = APP_DIRECTORIES.BACKUP_DIR + folderName;

      await makeDirectory(folderPath);

      const snapshot = {
        mapNamesDb: {},
        mapTilesDb: {},
        otherMapsDb: otherMapsDb,
        projectDb: projectDb,
        spotsDb: spotsDb,
      };

      await writeFileToDevice(folderPath, 'data.json', snapshot);
      console.log('Backup complete:', folderPath);
    }
    catch (err) {
      console.error('Backup failed:', err);
    }
  };

  const performAutoBackup = () => saveBackup(AUTO_BACKUP_PREFIX);
  const performSnapshot = () => saveBackup(SNAPSHOT_PREFIX);

  return {performAutoBackup, performSnapshot};
};

export default useAutoBackup;
