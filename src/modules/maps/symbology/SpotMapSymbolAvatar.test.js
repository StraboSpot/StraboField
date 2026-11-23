import React from 'react';
import {Image, Text} from 'react-native';

import {configureStore} from '@reduxjs/toolkit';
import * as turf from '@turf/turf';
import {Image as SvgImage, Path, Pattern, TextPath} from 'react-native-svg';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import {MAP_SYMBOLS} from './mapSymbology.constants';
import SpotMapSymbolAvatar from './SpotMapSymbolAvatar';
import homeReducer from '../../home/home.slice';
import projectReducer from '../../project/projects.slice';
import spotReducer from '../../spots/spots.slice';
import mapReducer from '../maps.slice';
import {STRAT_PATTERNS} from '../strat-section/stratSection.constants';

jest.mock('../../spots/useSpots', () => () => ({}));
// The interval fill reads deep into the strat section settings; a test interval names its fill directly
jest.mock('../strat-section/useStratSectionSymbology', () => () => ({
  getStratIntervalFill: properties => ({
    fillPattern: properties.isInterbed ? properties.testInterbedPattern : properties.testFillPattern,
  }),
}));

const deepFreeze = value => Object.values(Object.freeze(value)).forEach(v => typeof v === 'object' && v
  && deepFreeze(v));

const renderAvatar = (spot, mapState = {}) => {
  const store = configureStore({
    preloadedState: {
      map: {...mapReducer(undefined, {type: ''}), ...mapState},
      spot: {...spotReducer(undefined, {type: ''}), spots: {[spot.properties.id]: spot}},
    },
    reducer: {home: homeReducer, map: mapReducer, project: projectReducer, spot: spotReducer},
  });
  let renderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Provider store={store}><SpotMapSymbolAvatar spot={spot}/></Provider>);
  });
  return renderer.root;
};

const getTexts = root => root.findAllByType(Text).map(text => text.props.children).filter(Boolean);

describe('SpotMapSymbolAvatar', () => {
  it('stacks a symbol per measurement of a point, each with its label', () => {
    const spot = turf.point([-105, 40], {
      id: 1,
      name: 'Station 1',
      orientation_data: [
        {feature_type: 'bedding', strike: 30, dip: 45, type: 'planar_orientation'},
        {feature_type: 'fold_hinge', trend: 250, plunge: 20, type: 'linear_orientation'},
      ],
    });
    const root = renderAvatar(spot, {labelTypeOn: 'dip'});

    const symbols = root.findAllByType(Image).map(image => image.props.source);
    expect(symbols).toEqual([MAP_SYMBOLS.bedding_inclined, MAP_SYMBOLS.lineation_general]);
    expect(getTexts(root)).toEqual(['45', '20']);
  });

  it('draws a line in its trace color and dashes, labeled along it', () => {
    const spot = turf.lineString([[-105, 40], [-104.99, 40.01]], {
      id: 2,
      name: 'Fault A',
      trace: {trace_type: 'geologic_struc', geologic_structure_type: 'fault', trace_quality: 'approximate'},
    });
    const root = renderAvatar(spot, {labelTypeOn: 'name'});

    const line = root.findAllByType(Path).find(path => path.props.stroke);
    expect(line.props.stroke).toBe('#FF0000');
    expect(line.props.strokeDasharray).toHaveLength(2);
    expect(root.findByType(TextPath).props.children).toBe('Fault A');
  });

  it('styles a Spot frozen as the store hands it out', () => {
    const spot = turf.lineString([[-105, 40], [-104.99, 40.01]], {
      id: 8,
      trace: {trace_type: 'geologic_struc', geologic_structure_type: 'fault'},
    });
    deepFreeze(spot);
    const root = renderAvatar(spot);

    expect(root.findAllByType(Path).find(path => path.props.stroke).props.stroke).toBe('#FF0000');
  });

  it('fills a polygon and outlines it in black, labeled inside', () => {
    const spot = turf.polygon([[[-105, 40], [-104.99, 40], [-104.99, 40.01], [-105, 40.01], [-105, 40]]], {
      id: 3,
      name: 'Outcrop',
      surface_feature: {surface_feature_type: 'contiguous_outcrop'},
    });
    const root = renderAvatar(spot, {labelTypeOn: 'name'});

    const [fill, outline] = root.findAllByType(Path);
    expect(fill.props.fill).toBe('rgba(240, 128, 128, 0.4)');
    expect(outline.props.stroke).toBe('#000000');
    expect(getTexts(root)).toEqual(['Outcrop']);
  });

  it('draws no color circle without a tag color, and no symbol for a measurement the map cannot draw', () => {
    const spot = turf.point([-105, 40], {
      id: 5,
      orientation_data: [{feature_type: 'bedding', strike: 30, dip: null, type: 'planar_orientation'}],
    });
    const root = renderAvatar(spot);

    expect(root.findAllByType(Image)).toHaveLength(0);
    expect(root.findAll(node => node.props.style?.[1]?.borderRadius !== undefined)).toHaveLength(0);
  });

  it('draws a line whose points all sit in one place at the center', () => {
    const spot = turf.lineString([[-105, 40], [-105, 40]], {id: 6});
    const root = renderAvatar(spot);

    const line = root.findAllByType(Path).find(path => path.props.stroke);
    expect(line.props.d).not.toContain('NaN');
  });

  it('draws only the lines and polygons in a GeometryCollection', () => {
    const polygon = turf.polygon([[[0, 0], [10, 0], [10, 2], [0, 2], [0, 0]]]).geometry;
    const spot = turf.feature(turf.geometryCollection([polygon, turf.point([5, 1]).geometry]).geometry,
      {id: 7, strat_section_id: 9});
    const root = renderAvatar(spot, {stratSection: {strat_section_id: 9}});

    expect(root.findAllByType(Path)).toHaveLength(2);   // The polygon's fill and outline
  });

  it('fills a strat interval with its lithology pattern', () => {
    const interval = turf.polygon([[[0, 0], [10, 0], [10, 2], [0, 2], [0, 0]]], {
      id: 4,
      strat_section_id: 9,
      surface_feature: {surface_feature_type: 'strat_interval'},
      testFillPattern: 'limestone',
    });
    const root = renderAvatar(interval, {stratSection: {strat_section_id: 9}});

    const patternId = root.findByType(Pattern).props.id;
    expect(root.findAllByType(Path).some(path => path.props.fill === `url(#${patternId})`)).toBe(true);
  });

  it('fills the interbed of a frozen strat interval with its own pattern', () => {
    const bed = turf.polygon([[[0, 0], [10, 0], [10, 2], [0, 2], [0, 0]]]).geometry;
    const interbed = turf.polygon([[[0, 2], [10, 2], [10, 3], [0, 3], [0, 2]]]).geometry;
    const interval = turf.feature(turf.geometryCollection([bed, interbed]).geometry, {
      id: 10,
      strat_section_id: 9,
      surface_feature: {surface_feature_type: 'strat_interval'},
      testFillPattern: 'limestone',
      testInterbedPattern: 'sandstone',
    });
    deepFreeze(interval);
    const root = renderAvatar(interval, {stratSection: {strat_section_id: 9}});

    const patterns = root.findAllByType(Pattern).map(pattern => pattern.findByType(SvgImage).props.href);
    expect(patterns).toEqual([STRAT_PATTERNS.limestone, STRAT_PATTERNS.sandstone]);
  });
});
