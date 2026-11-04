import {getAutoSaveFileName, getAutoSavesToPrune} from './autoSave.helpers';

const autoSave = (minute, name) => `2026-11-04T10-${String(minute).padStart(2, '0')}-00${name ? '_' + name : ''}.json`;

it('names a save by when it was made and its project', () => {
  expect(getAutoSaveFileName('Field Trip #2')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_Field_Trip_2\.json$/);
  expect(getAutoSaveFileName()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
});

it('groups a new save with its project\'s earlier ones', () => {
  const fileNames = [autoSave(1, 'Field_Trip'), autoSave(2, 'Other')];
  expect(getAutoSavesToPrune(fileNames, getAutoSaveFileName('Field Trip'), 0)).toEqual([autoSave(1, 'Field_Trip')]);
});

it('removes only the oldest saves of the project just saved', () => {
  const fileNames = [autoSave(1, 'Field_Trip'), autoSave(2, 'Field_Trip'), autoSave(3, 'Field_Trip')];
  expect(getAutoSavesToPrune(fileNames, autoSave(3, 'Field_Trip'), 2)).toEqual([autoSave(1, 'Field_Trip')]);
});

it('leaves the saves of other projects alone', () => {
  const fileNames = [
    autoSave(1, 'Other'), autoSave(2, 'Other'), autoSave(3, 'Field_Trip'), autoSave(4, 'Field_Trip_2'),
    autoSave(5, 'Field_Trip'), autoSave(6),
  ];
  expect(getAutoSavesToPrune(fileNames, autoSave(5, 'Field_Trip'), 1)).toEqual([autoSave(3, 'Field_Trip')]);
});

it('groups the saves of an unnamed project together', () => {
  const fileNames = [autoSave(1), autoSave(2), autoSave(3, 'Field_Trip')];
  expect(getAutoSavesToPrune(fileNames, autoSave(2), 1)).toEqual([autoSave(1)]);
});

it('ignores files that are not auto saves', () => {
  const fileNames = [autoSave(1), '.DS_Store', 'notes.json'];
  expect(getAutoSavesToPrune(fileNames, autoSave(1), 0)).toEqual([autoSave(1)]);
});
