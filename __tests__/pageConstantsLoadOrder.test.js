// page.constants registers components that import page.constants back (directly, or through ModalWrapper), so
// whichever of them loads first is still mid-evaluation when page.constants runs. Every registered component must
// still be there when its function is called, whatever loads first.

const findMissingComponents = (pageConstants) => {
  const missing = [];
  Object.entries(pageConstants).forEach(([exportName, entries]) => {
    if (!Array.isArray(entries)) return;
    entries.filter(entry => entry && typeof entry === 'object').forEach((entry) => {
      Object.keys(entry).filter(key => key.endsWith('_component')).forEach((key) => {
        if (typeof entry[key] !== 'function' || !entry[key]()) missing.push(`${exportName} ${entry.key}.${key}`);
      });
    });
  });
  return missing;
};

test.each([
  '../src/modules/page/PageHeader',
  '../src/modules/tags/TagsNotebookModal',
  '../src/modules/fabrics/AddFabricModal',
  '../src/shared/ui/modals/ModalWrapper',
])('page.constants resolves every registered component with %s loaded first', (path) => {
  jest.isolateModules(() => {
    require(path);
    expect(findMissingComponents(require('../src/modules/page/page.constants'))).toEqual([]);
  });
});
