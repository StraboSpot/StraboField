import {isEmpty} from '../../../shared/helpers';

// A project prepared on the website (a field camp is the first kind) arrives in the profile as an entry with a
// .zip package. Every kind is handled the same way, so `kind` is only shown, never branched on.

// Only a built package can be downloaded
export const getReadyPreparedProjects = preparedProjects => (preparedProjects || []).filter(
  preparedProject => preparedProject?.package?.status === 'ready' && !isEmpty(preparedProject.package.url)
    && !isEmpty(preparedProject.package.version));

export const isPreparedProjectInstalled = preparedProject => !isEmpty(preparedProject?.package?.installed_version);

// The package was changed on the website after this account installed it
export const hasNewerPackage = preparedProject => isPreparedProjectInstalled(preparedProject)
  && preparedProject.package.installed_version !== preparedProject.package.version;

// Asked about once, at sign-in. Once installed it is never asked about again, even if it has since been deleted
// from the device, since that may have been done on purpose.
export const getPreparedProjectToOffer = preparedProjects => getReadyPreparedProjects(preparedProjects)
  .find(preparedProject => !isPreparedProjectInstalled(preparedProject));

export const getPreparedProjectName = preparedProject => preparedProject.project_name || preparedProject.title
  || 'Prepared Project';

// The folder under Projects on Device. The version is part of the name so a newer package is saved beside the
// one before it rather than over it, and a re-install of the same version finds the copy already there.
export const getPackageFolderName = (preparedProject, version = preparedProject.package.version) => (
  getPreparedProjectName(preparedProject) + '_' + version).replace(/[^A-Za-z0-9_-]+/g, '_');

// installed_version is the server's record that this account installed the package at some point, on any device,
// so it says nothing about whether the project is on this one. That is read from the device instead.
export const getPreparedProjectStatus = (preparedProject, {isOpen, isSaved}) => {
  const newerNote = hasNewerPackage(preparedProject)
    ? '\nA newer version of this package is available. Downloading it saves it beside the one installed.' : '';
  if (isOpen) return 'Open now' + newerNote;
  if (!isPreparedProjectInstalled(preparedProject)) return 'Not installed yet';
  if (isSaved) return 'Installed and saved under Projects on Device' + newerNote;
  return 'Installed before, but not on this device now' + newerNote;
};

export const formatPackageSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1048576) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  if (bytes < 1073741824) return Math.round(bytes / 1048576) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
};

export const describePackage = (preparedProject) => {
  const {offline_maps, size, tags} = preparedProject.package;
  return [
    formatPackageSize(size),
    offline_maps && `${offline_maps} offline map${offline_maps === 1 ? '' : 's'}`,
    tags && `${tags} tag${tags === 1 ? '' : 's'}`,
  ].filter(Boolean).join(', ');
};
