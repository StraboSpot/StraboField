import {LOCATION_MAX_FIX_AGE} from '../src/modules/maps/maps.constants';
import {getMoreAccuratePosition, isFreshPosition} from '../src/modules/maps/view/view.helpers';

const fix = (accuracy, timestamp = 0) => ({coords: {accuracy, latitude: 38.9, longitude: -95.2}, timestamp});

describe('isFreshPosition', () => {
  const requestStartTime = 1_000_000;

  it('accepts fixes taken after or just before the request started', () => {
    expect(isFreshPosition(fix(5, requestStartTime + 1000), requestStartTime)).toBe(true);
    expect(isFreshPosition(fix(5, requestStartTime - LOCATION_MAX_FIX_AGE), requestStartTime)).toBe(true);
  });

  it('rejects a stale cached fix', () => {
    expect(isFreshPosition(fix(5, requestStartTime - LOCATION_MAX_FIX_AGE - 1), requestStartTime)).toBe(false);
  });
});

describe('getMoreAccuratePosition', () => {
  it('takes the first fix when there is no best yet', () => {
    const first = fix(2000);
    expect(getMoreAccuratePosition(undefined, first)).toBe(first);
  });

  it('replaces a coarse cell/Wi-Fi fix with a GPS fix', () => {
    const coarse = fix(2000);
    const gps = fix(8);
    expect(getMoreAccuratePosition(coarse, gps)).toBe(gps);
  });

  it('keeps the better fix when a worse one arrives', () => {
    const gps = fix(8);
    expect(getMoreAccuratePosition(gps, fix(65))).toBe(gps);
  });
});
