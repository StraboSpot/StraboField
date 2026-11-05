import React from 'react';

import {ListItem} from '@rn-vui/base';
import RNFS from 'react-native-fs';
import ReactTestRenderer from 'react-test-renderer';

import RockdModal from '../src/services/data-intergration/macrostrat/RockdModal';
import OutlineButton from '../src/shared/ui/buttons/OutlineButton';

const mockConvertSpot = jest.fn();
const mockDeleteTempImagesFolder = jest.fn();
const mockDispatch = jest.fn();
const mockDoesDeviceDirExist = jest.fn();
const mockPostCheckin = jest.fn();
const mockPostImage = jest.fn();
const mockResizeImageForUpload = jest.fn();
let mockModalProps;
let mockState;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockState),
}));
jest.mock('../src/assets/images/logos/rockd_transparent.png', () => 1);
jest.mock('../src/modules/images/useImageSize', () => () => ({resizeImageForUpload: mockResizeImageForUpload}));
jest.mock('../src/modules/images/useImageThumbnails', () => () => ({
  areImageThumbnailsLoading: {},
  imageThumbnailURIs: {},
}));
jest.mock('../src/modules/spots/spots.slice', () => ({editedSpotProperties: jest.fn()}));
jest.mock('../src/modules/user/userProfile.slice', () => ({
  addedCheckedInSpotId: jest.fn(),
  setMacrostratToken: jest.fn(),
}));
jest.mock('../src/services/device/useDevice', () => () => ({
  deleteTempImagesFolder: mockDeleteTempImagesFolder,
  doesDeviceDirExist: mockDoesDeviceDirExist,
}));
jest.mock('../src/services/network/useServerRequests', () => () => ({
  convertSpotToMacrostrat: mockConvertSpot,
  openMacrostratLogin: jest.fn(),
  postCheckinImageToRockd: mockPostImage,
  postCheckinToRockd: mockPostCheckin,
}));
jest.mock('../src/shared/ui/modals/ModalWrapper', () => (props) => {
  mockModalProps = props;
  return props.children;
});
jest.mock('../src/utils/animations/LottieAnimations', () => () => null);

const images = [{id: 1}, {id: 2}, {id: 3}];

// What Rockd returns for a check-in sent with images 2 (the cover), 1 and 3
const photos = [
  {type: 'checkin', id: 99, local_id: '2.jpg'},
  {type: 'obs', id: 501, local_id: '1.jpg'},
  {type: 'obs', id: 502, local_id: '3.jpg'},
];

const renderModal = async () => {
  let renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<RockdModal closeModal={jest.fn()} isVisible={true}/>);
  });
  return renderer;
};

const convertedImageIds = () => mockConvertSpot.mock.lastCall[0].properties.images.map(image => image.id);

const postedImages = () => mockPostImage.mock.calls.map(([type, id]) => [type, id]);

const pressButton = (renderer, title) => ReactTestRenderer.act(
  () => renderer.root.findAllByType(OutlineButton).find(button => button.props.title === title).props.onPress());

const selectImage = (renderer, index) => ReactTestRenderer.act(
  () => renderer.root.findAllByType(ListItem.CheckBox)[index].props.onPress());

const sendCheckIn = () => ReactTestRenderer.act(() => mockModalProps.onActionPressed());

describe('RockdModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockState = {
      spot: {selectedSpot: {properties: {id: 10, images}}},
      user: {macrostrat: {token: 'rockd-token'}},
    };
    mockConvertSpot.mockResolvedValue({spot_id: 10});
    mockDoesDeviceDirExist.mockResolvedValue(true);
    mockPostCheckin.mockResolvedValue({success: {data: {checkin_id: 99, photos}}});
    mockPostImage.mockResolvedValue({success: {}});
    mockResizeImageForUpload.mockImplementation(async image => image);
    RNFS.readFile.mockResolvedValue('encoded');
  });

  afterEach(() => jest.restoreAllMocks());

  it('asks for a cover image before sending anything', async () => {
    const renderer = await renderModal();

    expect(renderer.root.findAllByType(ListItem.CheckBox)).toHaveLength(3);
    expect(mockModalProps.disabled).toBe(true);
    expect(mockConvertSpot).not.toHaveBeenCalled();
  });

  it('sends the cover first, then every image to the id Rockd gave it', async () => {
    const renderer = await renderModal();
    await selectImage(renderer, 1);
    expect(mockModalProps.disabled).toBe(false);
    await sendCheckIn();

    expect(convertedImageIds()).toEqual([2, 1, 3]);
    expect(mockPostCheckin).toHaveBeenCalledWith({spot_id: 10, token: 'rockd-token'});
    expect(postedImages()).toEqual([['checkin', 99], ['obs', 501], ['obs', 502]]);
    expect(mockPostImage).toHaveBeenCalledWith('checkin', 99, 'encoded', 'rockd-token');
    expect(RNFS.readFile.mock.calls[0][0]).toMatch(/\/2\.jpg$/);
    expect(mockDeleteTempImagesFolder).toHaveBeenCalled();
  });

  it('sends no images when told not to include them', async () => {
    const renderer = await renderModal();
    await selectImage(renderer, 0);
    await pressButton(renderer, 'Do Not Include');

    expect(convertedImageIds()).toEqual([]);
    expect(mockPostImage).not.toHaveBeenCalled();
  });

  it('offers and sends only the images on this device', async () => {
    mockDoesDeviceDirExist.mockImplementation(async uri => !uri.includes('2.jpg'));

    const renderer = await renderModal();
    expect(renderer.root.findAllByType(ListItem.CheckBox)).toHaveLength(2);
    await selectImage(renderer, 1);
    await sendCheckIn();

    expect(convertedImageIds()).toEqual([3, 1]);
    expect(postedImages()).toEqual([['obs', 501], ['obs', 502]]);
  });

  it('checks in straight away with no images on this device, and says so', async () => {
    mockDoesDeviceDirExist.mockResolvedValue(false);

    const renderer = await renderModal();

    expect(convertedImageIds()).toEqual([]);
    expect(mockPostImage).not.toHaveBeenCalled();
    expect(JSON.stringify(renderer.toJSON())).toContain('none were sent');
  });

  it('checks in straight away for a Spot with no images', async () => {
    mockState.spot.selectedSpot.properties.images = undefined;

    const renderer = await renderModal();

    expect(mockPostCheckin).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(renderer.toJSON())).not.toContain('none were sent');
  });

  it('retries only the images not yet sent, without a second check-in', async () => {
    mockPostImage.mockResolvedValueOnce({success: {}}).mockResolvedValueOnce({error: {message: 'Image too large'}});

    const renderer = await renderModal();
    await selectImage(renderer, 1);
    await sendCheckIn();
    expect(JSON.stringify(renderer.toJSON())).toContain('Image too large');

    mockPostImage.mockClear();
    await pressButton(renderer, 'Retry');

    expect(mockPostCheckin).toHaveBeenCalledTimes(1);
    expect(postedImages()).toEqual([['obs', 501], ['obs', 502]]);
  });

  it('keeps the selected cover when retrying a failed check-in', async () => {
    mockPostCheckin.mockResolvedValueOnce({error: {message: 'Invalid check-in'}});

    const renderer = await renderModal();
    await selectImage(renderer, 2);
    await sendCheckIn();
    expect(JSON.stringify(renderer.toJSON())).toContain('Invalid check-in');
    expect(mockPostImage).not.toHaveBeenCalled();

    await pressButton(renderer, 'Retry');

    expect(mockPostCheckin).toHaveBeenCalledTimes(2);
    expect(convertedImageIds()).toEqual([3, 1, 2]);
  });
});
