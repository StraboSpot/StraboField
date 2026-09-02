import {
  cartesianToSpherical,
  getHeading,
  getStrikeAndDip,
  getTrendAndPlunge,
  mod,
} from './compassMath.helpers';

// Golden-value + invariant tests for the pure compass math. The strike/dip and trend/plunge
// conventions are pinned here as characterization (the sign/axis conventions themselves can only be
// confirmed against a physical measurement); the invariants below — angle wrapping, dip = pole angle
// from vertical, plunge = angle below horizontal — are true regardless of convention and are what a
// refactor must preserve.

const D = deg => (deg * Math.PI) / 180;

describe('mod', () => {
  it('wraps negative values into [0, degree)', () => {
    expect(mod(-10, 360)).toBe(350);
    expect(mod(-370, 360)).toBe(350);
    expect(mod(-1, 360)).toBe(359);
  });

  it('is the identity inside the range', () => {
    expect(mod(0, 360)).toBe(0);
    expect(mod(45, 360)).toBe(45);
    expect(mod(359, 360)).toBe(359);
  });

  it('wraps values at or above the modulus', () => {
    expect(mod(360, 360)).toBe(0);
    expect(mod(720, 360)).toBe(0);
    expect(mod(375, 360)).toBe(15);
  });

  it('never returns a negative, unlike the built-in % operator', () => {
    // This is the whole reason mod() exists: (strike + westerlyDeclination) % 360 can go negative.
    for (let v = -720; v <= 720; v += 7) {
      expect(mod(v, 360)).toBeGreaterThanOrEqual(0);
      expect(mod(v, 360)).toBeLessThan(360);
    }
  });
});

describe('cartesianToSpherical', () => {
  it('returns rho as the vector magnitude', () => {
    expect(cartesianToSpherical(3, 4, 0).rho).toBeCloseTo(5, 10);
    expect(cartesianToSpherical(1, 2, 2).rho).toBeCloseTo(3, 10);
  });

  it('measures phi from the +third axis (up): straight up is 0, straight down is pi', () => {
    expect(cartesianToSpherical(0, 0, 1).phi).toBeCloseTo(0, 10);
    expect(cartesianToSpherical(0, 0, -1).phi).toBeCloseTo(Math.PI, 10);
    expect(cartesianToSpherical(1, 0, 0).phi).toBeCloseTo(Math.PI / 2, 10);
  });

  it('measures theta as atan2(second, first) in the horizontal plane', () => {
    expect(cartesianToSpherical(1, 0, 0).theta).toBeCloseTo(0, 10);
    expect(cartesianToSpherical(0, 1, 0).theta).toBeCloseTo(Math.PI / 2, 10);
    expect(cartesianToSpherical(-1, 0, 0).theta).toBeCloseTo(Math.PI, 10);
  });

  it('degenerates cleanly on the vertical axis (theta = 0, no NaN)', () => {
    expect(cartesianToSpherical(0, 0, 1)).toEqual({rho: 1, phi: 0, theta: 0});
    expect(cartesianToSpherical(0, 0, -1)).toEqual({rho: 1, phi: Math.PI, theta: 0});
  });

  it('returns all zeros for the zero vector rather than NaN', () => {
    expect(cartesianToSpherical(0, 0, 0)).toEqual({rho: 0, phi: 0, theta: 0});
  });
});

describe('getStrikeAndDip', () => {
  it('reads a horizontal plane (pole straight up) as dip 0', () => {
    const {strike, dip} = getStrikeAndDip(cartesianToSpherical(0, 0, 1));
    expect(dip).toBeCloseTo(0, 6);
    expect(strike).toBeCloseTo(0, 6);
  });

  it('sets dip equal to the pole angle from vertical', () => {
    // Pole tilted 30 deg from vertical -> dip 30, regardless of azimuth.
    [10, 30, 45, 60, 89].forEach((deg) => {
      const {dip} = getStrikeAndDip(cartesianToSpherical(Math.sin(D(deg)), 0, Math.cos(D(deg))));
      expect(dip).toBeCloseTo(deg, 6);
    });
  });

  it('keeps strike in [0, 360)', () => {
    for (let az = 0; az < 360; az += 15) {
      const e = Math.sin(D(30)) * Math.sin(D(az));
      const n = Math.sin(D(30)) * Math.cos(D(az));
      const {strike} = getStrikeAndDip(cartesianToSpherical(e, n, Math.cos(D(30))));
      expect(strike).toBeGreaterThanOrEqual(0);
      expect(strike).toBeLessThan(360);
    }
  });

  it('pins the current strike convention (characterization)', () => {
    // Pole tilted toward E/W/N by a known amount -> these exact strike values.
    expect(getStrikeAndDip(cartesianToSpherical(Math.sin(D(45)), 0, Math.cos(D(45)))).strike).toBeCloseTo(0, 6);
    expect(getStrikeAndDip(cartesianToSpherical(-Math.sin(D(30)), 0, Math.cos(D(30)))).strike).toBeCloseTo(180, 6);
    expect(getStrikeAndDip(cartesianToSpherical(0, Math.sin(D(20)), Math.cos(D(20)))).strike).toBeCloseTo(270, 6);
  });

  it('handles a pole below the horizon (phi > 90) via the else branch', () => {
    // Downward-pointing pole 30 deg below horizontal still yields a dip in [0, 90].
    const {dip} = getStrikeAndDip(cartesianToSpherical(Math.cos(D(30)), 0, -Math.sin(D(30))));
    expect(dip).toBeGreaterThanOrEqual(0);
    expect(dip).toBeLessThanOrEqual(90);
  });
});

describe('getTrendAndPlunge', () => {
  it('reads a horizontal vector as plunge 0', () => {
    expect(getTrendAndPlunge(cartesianToSpherical(0, 1, 0)).plunge).toBeCloseTo(0, 6);
  });

  it('sets plunge to the angle below horizontal for a downward vector', () => {
    const {trend, plunge} = getTrendAndPlunge(cartesianToSpherical(Math.cos(D(40)), 0, -Math.sin(D(40))));
    expect(plunge).toBeCloseTo(40, 6);
    expect(trend).toBeCloseTo(90, 6); // pointing East
  });

  it('flips an upward-pointing vector to its downward equivalent (plunge always >= 0)', () => {
    for (let az = 0; az < 360; az += 30) {
      for (const incl of [-60, -10, 10, 60]) {
        const e = Math.cos(D(incl)) * Math.sin(D(az));
        const n = Math.cos(D(incl)) * Math.cos(D(az));
        const u = Math.sin(D(incl));
        const {trend, plunge} = getTrendAndPlunge(cartesianToSpherical(e, n, u));
        expect(plunge).toBeGreaterThanOrEqual(0);
        expect(plunge).toBeLessThanOrEqual(90);
        expect(trend).toBeGreaterThanOrEqual(0);
        expect(trend).toBeLessThan(360);
      }
    }
  });

  it('pins the vertical case (characterization)', () => {
    expect(getTrendAndPlunge(cartesianToSpherical(0, 0, 1))).toEqual({trend: 270, plunge: 90});
  });
});

describe('getHeading', () => {
  it('converts a yaw in radians to an integer compass degree', () => {
    expect(getHeading(0)).toBe(0);
    expect(getHeading(Math.PI / 2)).toBe(90);
    expect(getHeading(Math.PI)).toBe(180);
  });

  it('wraps a negative yaw into [0, 360)', () => {
    expect(getHeading(-Math.PI / 2)).toBe(270);
  });
});
