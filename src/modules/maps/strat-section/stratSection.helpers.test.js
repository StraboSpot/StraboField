import {getImageOverlayOpacity} from './stratSection.helpers';

describe('getImageOverlayOpacity', () => {
  it('keeps an opacity of 0, which is an overlay meant to be invisible', () => {
    expect(getImageOverlayOpacity(0)).toBe(0);
    expect(getImageOverlayOpacity('0')).toBe(0);
  });

  it('keeps an opacity between 0 and 1, whether it is a number or the text it was typed as', () => {
    expect(getImageOverlayOpacity(0.5)).toBe(0.5);
    expect(getImageOverlayOpacity('0.25')).toBe(0.25);
    expect(getImageOverlayOpacity(1)).toBe(1);
  });

  it('falls back to fully opaque when there is no opacity to read', () => {
    expect(getImageOverlayOpacity(undefined)).toBe(1);
    expect(getImageOverlayOpacity('')).toBe(1);
  });

  it('falls back to fully opaque for an opacity outside 0 to 1, which older data can still carry', () => {
    expect(getImageOverlayOpacity(1.5)).toBe(1);
    expect(getImageOverlayOpacity(-0.5)).toBe(1);
  });
});
