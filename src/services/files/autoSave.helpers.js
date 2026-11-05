import moment from 'moment';

export const MAX_SAVES_PER_PROJECT = 30;

// An auto save is named by when it was made, then `_Project_Name` (absent for an unnamed project)
const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH-mm-ss';

const getProjectPart = fileName => fileName.slice(TIMESTAMP_FORMAT.length, -'.json'.length);

const isAutoSave = fileName => /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/.test(fileName) && fileName.endsWith('.json');

export const getAutoSaveFileName = (projectName = '') => {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/, '');
  return moment().format(TIMESTAMP_FORMAT) + (sanitizedName ? '_' + sanitizedName : '') + '.json';
};

// The saves past the newest maxSaves of the project savedFileName belongs to; other projects' saves are left alone
export const getAutoSavesToPrune = (fileNames, savedFileName, maxSaves) => (
  fileNames
    .filter(fileName => isAutoSave(fileName) && getProjectPart(fileName) === getProjectPart(savedFileName))
    .sort()
    .reverse()
    .slice(maxSaves)
);
