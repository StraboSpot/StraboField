import {
  convertLatLngToUtm,
  convertUtmToLatLng,
  getClosestSpotDistanceAndIndex,
  getUtmDisplayString,
  parseUtmZone,
} from './maps.helpers';

// Characterization tests: these pin the CURRENT behavior of the pure geometry helpers
// (bugs and quirks included) so a later refactor can be shown to preserve behavior. They are
// intentionally assertion-heavy on structure, not prose.

describe('getClosestSpotDistanceAndIndex', () => {
  it('returns the minimum distance and its index', () => {
    expect(getClosestSpotDistanceAndIndex([5, 2, 8, 1, 9])).toEqual([1, 3]);
  });

  it('returns the first occurrence on ties (strict greater-than comparison)', () => {
    expect(getClosestSpotDistanceAndIndex([3, 3, 3])).toEqual([3, 0]);
  });

  it('handles a single-element array', () => {
    expect(getClosestSpotDistanceAndIndex([7])).toEqual([7, 0]);
  });

  it('returns [Number.MAX_VALUE, -1] for an empty array', () => {
    expect(getClosestSpotDistanceAndIndex([])).toEqual([Number.MAX_VALUE, -1]);
  });
});

// The UTM helpers below are checked against the invariants of the projection itself rather than
// against remembered coordinates: on a zone's central meridian the easting is exactly 500,000, and
// the equator is northing 0 going north / 10,000,000 going south. Those hold for every zone.

describe('convertLatLngToUtm', () => {
  it('puts a point on the central meridian at exactly 500,000 mE', () => {
    // Central meridian of zone z is -180 + 6z - 3
    [1, 13, 31, 56, 60].forEach((zoneNumber) => {
      const {easting, zone} = convertLatLngToUtm([-180 + 6 * zoneNumber - 3, 40]);
      expect(easting).toBe(500000);
      expect(zone).toBe(`${zoneNumber}N`);
    });
  });

  it('puts the equator at northing 0 in the northern hemisphere', () => {
    expect(convertLatLngToUtm([-105, 0]).northing).toBe(0);
  });

  it('puts the equator at northing 10,000,000 in the southern hemisphere (false northing)', () => {
    expect(convertLatLngToUtm([-105, -0.0001]).northing).toBeCloseTo(10000000, -2);
  });

  it('picks the hemisphere from the latitude, treating 0 as north', () => {
    expect(convertLatLngToUtm([-105.2705, 40.015]).zone).toBe('13N');
    expect(convertLatLngToUtm([151.2093, -33.8688]).zone).toBe('56S');
    expect(convertLatLngToUtm([-105, 0]).zone).toBe('13N');
  });

  it('assigns zone numbers across the -180/180 boundary', () => {
    expect(convertLatLngToUtm([-180, 0]).zone).toBe('1N');
    expect(convertLatLngToUtm([-174.1, 0]).zone).toBe('1N');
    expect(convertLatLngToUtm([-174, 0]).zone).toBe('2N');
    expect(convertLatLngToUtm([0, 0]).zone).toBe('31N');
    expect(convertLatLngToUtm([179.99, 0]).zone).toBe('60N');
  });

  it('rounds easting and northing to the centimeter', () => {
    const {easting, northing} = convertLatLngToUtm([-105.2705, 40.015]);
    expect(easting).toBe(Math.round(easting * 100) / 100);
    expect(northing).toBe(Math.round(northing * 100) / 100);
  });
});

describe('convertUtmToLatLng', () => {
  it('round-trips a coordinate back to where it started', () => {
    [[-105.2705, 40.015], [151.2093, -33.8688], [-21.9426, 64.1466], [15.5, 78.01]].forEach(([lng, lat]) => {
      const utm = convertLatLngToUtm([lng, lat]);
      const [lngBack, latBack] = convertUtmToLatLng(utm.easting, utm.northing, utm.zone);
      expect(lngBack).toBeCloseTo(lng, 6);
      expect(latBack).toBeCloseTo(lat, 6);
    });
  });

  it('accepts easting and northing as strings, as they arrive from a text input', () => {
    const fromNumbers = convertUtmToLatLng(476915.24, 4429457.11, '13N');
    expect(convertUtmToLatLng('476915.24', '4429457.11', '13N')).toEqual(fromNumbers);
  });

  it('returns undefined for a zone it cannot parse', () => {
    expect(convertUtmToLatLng(500000, 4000000, '61N')).toBeUndefined();
    expect(convertUtmToLatLng(500000, 4000000, '13')).toBeUndefined();
  });
});

describe('getUtmDisplayString', () => {
  it('formats zone, easting and northing rounded to whole meters', () => {
    expect(getUtmDisplayString([-105.2705, 40.015])).toBe('UTM 13N  476915 mE  4429457 mN');
  });

  it('labels a southern hemisphere zone with S', () => {
    expect(getUtmDisplayString([151.2093, -33.8688])).toMatch(/^UTM 56S {2}\d+ mE {2}\d+ mN$/);
  });
});

describe('parseUtmZone', () => {
  it('parses a zone number and hemisphere', () => {
    expect(parseUtmZone('13N')).toEqual({isNorthernHemisphere: true, zoneNumber: 13});
    expect(parseUtmZone('56S')).toEqual({isNorthernHemisphere: false, zoneNumber: 56});
  });

  it('tolerates lowercase and surrounding or internal whitespace', () => {
    expect(parseUtmZone('59s')).toEqual({isNorthernHemisphere: false, zoneNumber: 59});
    expect(parseUtmZone(' 13 n ')).toEqual({isNorthernHemisphere: true, zoneNumber: 13});
  });

  it('accepts the first and last zones', () => {
    expect(parseUtmZone('1N').zoneNumber).toBe(1);
    expect(parseUtmZone('60S').zoneNumber).toBe(60);
  });

  it('returns undefined for zone numbers outside 1-60', () => {
    expect(parseUtmZone('0N')).toBeUndefined();
    expect(parseUtmZone('61N')).toBeUndefined();
  });

  it('returns undefined for malformed input', () => {
    ['13', 'N13', '13X', '', 'abc', undefined, null].forEach((zone) => {
      expect(parseUtmZone(zone)).toBeUndefined();
    });
  });
});
