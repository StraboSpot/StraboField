import {getNewId} from './helpers';

// The old generator was a millisecond timestamp plus one random digit, so it had 11 ids per millisecond
// and any burst of mints - saving several images picked at once, copying a Spot's features - repeated one.
describe('getNewId', () => {
  const mintBurst = count => Array.from({length: count}, () => getNewId());

  it('gives a distinct id every time, however fast it is called', () => {
    const ids = mintBurst(5000);
    expect(new Set(ids).size).toBe(5000);
  });

  it('gives distinct ids for two values minted back to back', () => {
    expect(getNewId()).not.toBe(getNewId());
  });

  // Tag Query's Date Created order sorts on the id itself (tags/query/tagQuery.helpers.js), so later has to be larger
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
