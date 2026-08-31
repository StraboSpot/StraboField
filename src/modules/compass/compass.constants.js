export const COMPASS_TOGGLE_BUTTONS = {
  LINEAR: 'Linear Feature',
  PLANAR: 'Planar Feature',
};

// Drawn compass dial
export const DIAL_SIZE = 190;
export const DIAL_TICKS = 36; // one tick every 10°, major ticks at the cardinals

// Issue #911: when enlarged, the dial grows to this fraction of the screen's shorter side so the
// whole face is a big tap target. The hosting modal widens to match via getEnlargedCompassModalWidth.
export const ENLARGED_DIAL_FRACTION = 0.8;
export const getEnlargedDialSize = (width, height) => Math.round(Math.min(width, height) * ENLARGED_DIAL_FRACTION);
export const getEnlargedCompassModalWidth = (width, height) => getEnlargedDialSize(width, height) + 40;
// The hosting modal also grows taller when enlarged so the big dial + its chrome aren't forced to scroll.
export const ENLARGED_COMPASS_MODAL_MAX_HEIGHT = '95%';
