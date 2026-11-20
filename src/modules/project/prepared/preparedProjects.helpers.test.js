import {
  describePackage,
  getPackageFolderName,
  getPreparedProjectStatus,
  getPreparedProjectToOffer,
  getReadyPreparedProjects,
  hasNewerPackage,
} from './preparedProjects.helpers';

// Shaped like an entry from the profile's prepared_projects
const makePreparedProject = (id, packageValues = {}) => ({
  id: id,
  kind: 'field_camp',
  title: 'Cool Camp',
  project_id: '17945006822567',
  project_name: 'Jason\'s Cool Camp 2026',
  package: {
    status: 'ready',
    url: `https://strabospot.org/db/projectPackage/${id}`,
    version: '906d9877872d',
    size: 89289578,
    offline_maps: 6,
    tags: 34,
    installed_version: null,
    ...packageValues,
  },
});

describe('prepared projects', () => {
  it('handles a profile with no prepared projects', () => {
    expect(getReadyPreparedProjects(undefined)).toEqual([]);
    expect(getPreparedProjectToOffer(undefined)).toBeUndefined();
  });

  it('leaves out a package that is not ready', () => {
    const building = makePreparedProject('c1', {status: 'building'});
    expect(getReadyPreparedProjects([building])).toEqual([]);
    expect(getPreparedProjectToOffer([building])).toBeUndefined();
  });

  it('offers the first package not yet installed', () => {
    const installed = makePreparedProject('c1', {installed_version: '906d9877872d'});
    const notInstalled = makePreparedProject('c2');
    expect(getPreparedProjectToOffer([installed, notInstalled])).toBe(notInstalled);
  });

  it('never offers an installed package again, even one with a newer version', () => {
    const changed = makePreparedProject('c1', {installed_version: 'older'});
    expect(getPreparedProjectToOffer([changed])).toBeUndefined();
    expect(hasNewerPackage(changed)).toBe(true);
    expect(hasNewerPackage(makePreparedProject('c1', {installed_version: '906d9877872d'}))).toBe(false);
    expect(hasNewerPackage(makePreparedProject('c1'))).toBe(false);
  });

  it('names the folder by project and version so a newer package is saved beside the old one', () => {
    expect(getPackageFolderName(makePreparedProject('c2'))).toBe('Jason_s_Cool_Camp_2026_906d9877872d');
    expect(getPackageFolderName(makePreparedProject('c2', {version: 'abc'})))
      .not.toBe(getPackageFolderName(makePreparedProject('c2')));
  });

  it('describes the package contents', () => {
    expect(describePackage(makePreparedProject('c2'))).toBe('85 MB, 6 offline maps, 34 tags');
    expect(describePackage(makePreparedProject('c2', {offline_maps: 1, tags: 0}))).toBe('85 MB, 1 offline map');
  });

  it('reports an installed package missing from the device instead of calling it installed', () => {
    const installed = makePreparedProject('c2', {installed_version: '906d9877872d'});
    expect(getPreparedProjectStatus(installed, {isOpen: false, isSaved: false})).toMatch(/not on this device/);
    expect(getPreparedProjectStatus(installed, {isOpen: false, isSaved: true})).toMatch(/^Installed and saved/);
    expect(getPreparedProjectStatus(installed, {isOpen: true, isSaved: false})).toBe('Open now');
    expect(getPreparedProjectStatus(makePreparedProject('c2'), {isOpen: false, isSaved: false}))
      .toBe('Not installed yet');
  });
});
