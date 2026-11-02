import React from 'react';
import {Text} from 'react-native';

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
jest.mock('../src/modules/project/projects.slice', () => ({updatedModifiedTimestampsBySpotsIds: jest.fn()}));
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

const renderModal = async () => {
  let renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<RockdModal closeModal={jest.fn()} isVisible={true}/>);
  });
  return renderer;
};

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
    mockConvertSpot.mockResolvedValue({photo: '1.jpg', spot_id: 10});
    mockDoesDeviceDirExist.mockResolvedValue(true);
    mockPostCheckin.mockResolvedValue({success: {data: {checkin_id: 99}}});
    mockPostImage.mockResolvedValue({success: {}});
    mockResizeImageForUpload.mockImplementation(async image => image);
    RNFS.readFile.mockResolvedValue('encoded');
  });

  afterEach(() => jest.restoreAllMocks());

  it('asks for a cover image before sending anything', async () => {
    const renderer = await renderModal();

    expect(renderer.root.findAllByType(Text).map(node => node.props.children))
      .toContain('Select a main cover image for this check-in.');
    expect(renderer.root.findAllByType(ListItem.CheckBox)).toHaveLength(3);
    expect(mockModalProps.disabled).toBe(true);
    expect(mockConvertSpot).not.toHaveBeenCalled();
  });

  it('sends only the selected image, as the check-in photo', async () => {
    const renderer = await renderModal();
    await selectImage(renderer, 1);
    expect(mockModalProps.disabled).toBe(false);
    await sendCheckIn();

    expect(mockPostCheckin).toHaveBeenCalledWith({photo: '2.jpg', spot_id: 10, token: 'rockd-token'});
    expect(mockPostImage).toHaveBeenCalledTimes(1);
    expect(mockPostImage).toHaveBeenCalledWith(99, 'encoded', 'rockd-token');
    expect(RNFS.readFile).toHaveBeenCalledWith(expect.stringMatching(/\/2\.jpg$/), 'base64');
    expect(mockDeleteTempImagesFolder).toHaveBeenCalled();
  });

  it('sends no image when told not to include one', async () => {
    const renderer = await renderModal();
    await selectImage(renderer, 0);
    await pressButton(renderer, 'Do Not Include');

    expect(mockPostCheckin).toHaveBeenCalledWith({spot_id: 10, token: 'rockd-token'});
    expect(mockPostImage).not.toHaveBeenCalled();
  });

  it('offers only the images on this device', async () => {
    mockDoesDeviceDirExist.mockImplementation(async uri => !uri.includes('2.jpg'));

    const renderer = await renderModal();

    expect(renderer.root.findAllByType(ListItem.CheckBox)).toHaveLength(2);
  });

  it('checks in straight away with no images on this device, and says so', async () => {
    mockDoesDeviceDirExist.mockResolvedValue(false);

    const renderer = await renderModal();

    expect(mockPostImage).not.toHaveBeenCalled();
    expect(mockPostCheckin).toHaveBeenCalledWith({spot_id: 10, token: 'rockd-token'});
    expect(JSON.stringify(renderer.toJSON())).toContain('none were sent');
  });

  it('checks in straight away for a Spot with no images', async () => {
    mockState.spot.selectedSpot.properties.images = undefined;

    const renderer = await renderModal();

    expect(mockPostCheckin).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(renderer.toJSON())).not.toContain('none were sent');
  });

  it('retries only the image, without a second check-in', async () => {
    mockPostImage.mockResolvedValueOnce({error: {message: 'Image too large'}});

    const renderer = await renderModal();
    await selectImage(renderer, 0);
    await sendCheckIn();
    expect(JSON.stringify(renderer.toJSON())).toContain('Image too large');

    await pressButton(renderer, 'Retry');

    expect(mockPostCheckin).toHaveBeenCalledTimes(1);
    expect(mockPostImage).toHaveBeenCalledTimes(2);
  });

  it('keeps the selected image when retrying a failed check-in', async () => {
    mockPostCheckin.mockResolvedValueOnce({error: {message: 'Invalid check-in'}});

    const renderer = await renderModal();
    await selectImage(renderer, 2);
    await sendCheckIn();
    expect(JSON.stringify(renderer.toJSON())).toContain('Invalid check-in');
    expect(mockPostImage).not.toHaveBeenCalled();

    await pressButton(renderer, 'Retry');

    expect(mockPostCheckin).toHaveBeenLastCalledWith({photo: '3.jpg', spot_id: 10, token: 'rockd-token'});
    expect(mockPostImage).toHaveBeenCalledTimes(1);
  });
});
