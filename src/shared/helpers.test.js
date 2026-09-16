import {getNewId, getNewUUID, getTimestampFromId, isSameId} from './helpers';

// The old generator was a millisecond timestamp plus one random digit, so it had 11 ids per millisecond
// and any burst of mints - saving several templates at once, copying a Spot's features - repeated one.
describe('getNewId', () => {
  const mintBurst = count => Array.from({length: count}, () => getNewId());

  it('gives a distinct id every time, however fast it is called', () => {
    const ids = mintBurst(5000);
    expect(new Set(ids).size).toBe(5000);
  });

  it('gives distinct ids for two values minted back to back', () => {
    expect(getNewId()).not.toBe(getNewId());
  });

  // Tag Query's Date Created order sorts on the id itself (tagQuery.helpers.js), so later has to be larger
  it('increases with every id, so a later id always sorts after an earlier one', () => {
    const ids = mintBurst(1000);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sorted);
  });

  it('stays a safe integer, since Spot and dataset ids go to the server as numbers', () => {
    expect(Number.isSafeInteger(getNewId())).toBe(true);
  });

  // Past Number.MAX_SAFE_INTEGER JavaScript drops an integer's low digits and two different ids compare
  // equal, which has bitten this app before. Guards the margin, so widening the multiplier fails here first
  it('keeps two orders of magnitude of room below the safe integer ceiling', () => {
    expect(getNewId()).toBeLessThan(Number.MAX_SAFE_INTEGER / 100);
  });

  // A burst steps past the last id issued instead of widening the number, so 1000 ids cost about 1000
  // steps - a tenth of a second of drift ahead of the clock - rather than three more digits
  it('advances about one step per id during a burst', () => {
    const idBefore = getNewId();
    const ids = mintBurst(1000);
    expect(ids[999] - idBefore).toBeLessThan(2000);
  });
});

describe('getNewUUID', () => {
  it('gives a distinct string every time', () => {
    const ids = Array.from({length: 5000}, () => getNewUUID());
    expect(new Set(ids).size).toBe(5000);
    expect(typeof ids[0]).toBe('string');
  });
});

// Feature ids minted from here on are UUIDs while those already in the field are numbers, so anything
// comparing the two has to coerce - see isSameId's use across projects.slice.js and useSpots.js
describe('isSameId', () => {
  it('matches a number against its own string form', () => {
    expect(isSameId(1756000000001, '1756000000001')).toBe(true);
  });

  it('matches a UUID against itself', () => {
    const uuid = getNewUUID();
    expect(isSameId(uuid, uuid)).toBe(true);
  });

  it('keeps a UUID and a number apart', () => {
    expect(isSameId(getNewUUID(), 1756000000001)).toBe(false);
  });
});

// getNewId built ids as a millisecond timestamp times ten plus a random digit, so the creation time of a
// record made before created_timestamp existed can still be read back out of its id
describe('getTimestampFromId', () => {
  it('recovers the millisecond an old id was minted', () => {
    const mintedAt = 1756000000000;
    const id = Math.floor((mintedAt + 0.7) * 10);
    expect(getTimestampFromId(id)).toBe(mintedAt);
  });

  // The trailing random digit has to be dropped, not divided into a fraction
  it('returns whole milliseconds, whatever random digit the id ended with', () => {
    const mintedAt = 1756000000000;
    for (let digit = 0; digit < 10; digit++) {
      expect(getTimestampFromId(mintedAt * 10 + digit)).toBe(mintedAt);
    }
  });

  it('reads an id that arrived as a string', () => {
    expect(getTimestampFromId('17560000000007')).toBe(1756000000000);
  });

  it('gives nothing for a UUID, which holds no time', () => {
    expect(getTimestampFromId(getNewUUID())).toBeUndefined();
  });

  it('gives nothing for a missing id', () => {
    expect(getTimestampFromId(undefined)).toBeUndefined();
    expect(getTimestampFromId('')).toBeUndefined();
  });

  // The monotonic step runs ids ahead of the clock after a burst, and this file mints thousands, so the
  // recovered time is about now rather than exactly now. Records minted by this generator carry a real
  // created_timestamp anyway - an id is only ever read back when the record predates that field.
  it('round-trips an id from the current generator to about now', () => {
    expect(Math.abs(getTimestampFromId(getNewId()) - Date.now())).toBeLessThan(5000);
  });
});
