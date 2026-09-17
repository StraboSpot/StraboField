import {getEnteredLabel, getTitle} from './otherFeatures.helpers';

// Before labels were shown, a save filled the field in with the feature's name whenever it was left blank, so
// every Other Feature saved back then carries one. Reading those as labels would drop the type from every row.
describe('getEnteredLabel', () => {
  it('ignores a label left over from the old save', () => {
    expect(getEnteredLabel({label: 'Creek fault', name: 'Creek fault', type: 'fault'})).toBeUndefined();
  });

  it('gives back a label someone actually entered', () => {
    expect(getEnteredLabel({label: 'Big one by the creek', name: 'Creek fault'})).toBe('Big one by the creek');
  });

  it('reads a feature with no label as having none', () => {
    expect(getEnteredLabel({name: 'Creek fault'})).toBeUndefined();
  });
});

describe('getTitle', () => {
  it('names a feature by its name and type', () => {
    expect(getTitle({name: 'Creek fault', type: 'fault'})).toBe('Creek fault - FAULT');
  });

  it('says so when either is missing', () => {
    expect(getTitle({})).toBe('Unnamed Feature - UNKNOWN');
  });
});
