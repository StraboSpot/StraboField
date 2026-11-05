import React from 'react';

import {act, create} from 'react-test-renderer';

import useImages from './useImages';

const mockDispatch = jest.fn();
const mockState = {map: {}, project: {project: {}}, spot: {selectedSpot: {}, spots: {}}};

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockState),
}));
jest.mock('@react-navigation/native', () => ({useNavigation: () => ({})}));
jest.mock('react-native-image-picker', () => ({}));
jest.mock('react-native-toast-notifications', () => ({useToast: () => ({})}));
jest.mock('./useImageSize', () => () => ({}));
jest.mock('../../services/device/useCompassCore', () => () => ({}));
jest.mock('../../services/device/usePermissions', () => () => ({}));
jest.mock('../../services/device/useDevice', () => () => ({doesDeviceDirExist: async () => false}));

const getHook = () => {
  let hookApi;
  const Probe = () => {
    hookApi = useImages();
    return null;
  };
  act(() => {
    create(<Probe/>);
  });
  return hookApi;
};

const spotWithImages = imageIds => ({properties: {id: 1, images: imageIds.map(id => ({id}))}});
const getDispatchedTypes = () => mockDispatch.mock.calls.map(([action]) => action.type);

beforeEach(() => mockDispatch.mockClear());

it('deletes an image from the Spot holding it', async () => {
  const {deleteImageFromSpot} = getHook();
  await act(() => deleteImageFromSpot(7, spotWithImages([5, 7])));
  const edit = mockDispatch.mock.calls.find(([action]) => action.type === 'spot/editedSpotProperties');
  expect(edit[0].payload).toEqual({field: 'images', value: [{id: 5}]});
});

// Any other Spot would be marked edited with nothing removed, and the image file deleted
it.each([
  ['a Spot with other images', spotWithImages([5])],
  ['a Spot with no images', {properties: {id: 1}}],
  ['no Spot', {}],
])('changes nothing given %s', async (name, spot) => {
  const {deleteImageFromSpot} = getHook();
  await act(() => deleteImageFromSpot(7, spot));
  expect(getDispatchedTypes()).toEqual(['home/openedMessageModal']);
});
