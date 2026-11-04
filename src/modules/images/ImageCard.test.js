import React from 'react';

import {combineReducers, configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import ImageCard from './ImageCard';
import connectionsReducer from '../connections/connections.slice';

const mockDeleteImageFromSpot = jest.fn();
const mockSpotWithImage = {properties: {id: 1, images: [{id: 7}]}};

jest.mock('./ImageThumbnail', () => 'ImageThumbnail');
jest.mock('../../shared/ui/modals/ModalWrapper', () => 'ModalWrapper');
jest.mock('../../shared/ui/SwitchWrapper', () => 'SwitchWrapper');
jest.mock('../../shared/ui/TextInput', () => 'TextInput');
// The image is on neither the device nor the server
jest.mock('../../services/device/useDevice', () => () => ({downloadImageAndSave: async () => false}));
jest.mock('./useImageThumbnails', () => () => ({getImageThumbnailURIs: jest.fn()}));
jest.mock('./useImages', () => () => ({deleteImageFromSpot: mockDeleteImageFromSpot}));
jest.mock('../spots/useSpots', () => () => ({
  getAllSpotsOnImageBasemap: () => [],
  getSpotByImageId: imageId => (imageId === 7 ? mockSpotWithImage : undefined),
}));

const image = {id: 7, title: 'Outcrop'};

const renderCard = (props) => {
  const store = configureStore({reducer: combineReducers({connections: connectionsReducer})});
  let renderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <Provider store={store}>
        <ImageCard
          areImageThumbnailsLoading={{}}
          image={image}
          imageThumbnailURIs={{}}
          index={0}
          setAreImageThumbnailsLoading={jest.fn()}
          setImageThumbnailURIs={jest.fn()}
          {...props}
        />
      </Provider>,
    );
  });
  return renderer.root;
};

// Tapping a thumbnail that can't be downloaded offers to delete it
const pressDeleteOnMissingImage = async (root) => {
  await ReactTestRenderer.act(() => root.findByType('ImageThumbnail').props.onImagePressed());
  const modal = root.findByType('ModalWrapper');
  expect(modal.props.isVisible).toBe(true);
  await ReactTestRenderer.act(() => modal.props.onActionPressed());
};

beforeEach(() => mockDeleteImageFromSpot.mockClear());

it('deletes a missing image through its owner, such as a memo', async () => {
  const deleteImage = jest.fn(async () => true);
  const root = renderCard({deleteImage});
  await pressDeleteOnMissingImage(root);
  expect(deleteImage).toHaveBeenCalledWith(image);
  expect(mockDeleteImageFromSpot).not.toHaveBeenCalled();
  expect(root.findByType('ModalWrapper').props.isVisible).toBe(false);
});

it('deletes a missing image from the Spot holding it', async () => {
  const root = renderCard();
  await pressDeleteOnMissingImage(root);
  expect(mockDeleteImageFromSpot).toHaveBeenCalledWith(7, mockSpotWithImage);
});

it('offers no delete for a read only image', async () => {
  const root = renderCard({deleteImage: jest.fn(), isReadOnlyImage: true});
  await ReactTestRenderer.act(() => root.findByType('ImageThumbnail').props.onImagePressed());
  expect(root.findByType('ModalWrapper').props.isVisible).toBe(false);
});
