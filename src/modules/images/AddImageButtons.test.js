import React from 'react';

import {act, create} from 'react-test-renderer';

import AddImageButtons from './AddImageButtons';

let mockImportedImages = [];
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: () => false,
}));
jest.mock('./useImages', () => () => ({
  getImagesFromCameraRoll: async () => mockImportedImages,
  launchCameraFromNotebook: async () => [],
}));
jest.mock('../../services/files/useUpload', () => () => ({uploadFromWeb: jest.fn()}));
jest.mock('../../shared/ui/buttons/OutlineButton', () => 'OutlineButton');
jest.mock('../../shared/ui/modals/DismissibleWarningModal', () => 'DismissibleWarningModal');
jest.mock('../sketch/SketchModal', () => 'SketchModal');

// Dismissing the picker resolves with no images. Passing those on tells the user they saved something and marks the
// Spot as modified when nothing happened.
describe('AddImageButtons import', () => {
  const pressImport = async (saveImages) => {
    let renderer;
    await act(async () => {
      renderer = create(<AddImageButtons saveImages={saveImages}/>);
    });
    const importButton = renderer.root.findAllByType('OutlineButton').find(b => b.props.title === 'Import');
    await act(async () => {
      await importButton.props.onPress();
    });
  };

  beforeEach(() => mockDispatch.mockClear());

  it('saves nothing when the picker is dismissed', async () => {
    mockImportedImages = [];
    const saveImages = jest.fn();
    await pressImport(saveImages);
    expect(saveImages).not.toHaveBeenCalled();
  });

  it('saves the images that were picked', async () => {
    mockImportedImages = [{id: 1}];
    const saveImages = jest.fn();
    await pressImport(saveImages);
    expect(saveImages).toHaveBeenCalledWith([{id: 1}]);
  });

  it('clears the loading status after a dismissal', async () => {
    mockImportedImages = [];
    await pressImport(jest.fn());
    expect(mockDispatch).toHaveBeenLastCalledWith(expect.objectContaining({
      payload: {view: 'home', bool: false},
    }));
  });
});
