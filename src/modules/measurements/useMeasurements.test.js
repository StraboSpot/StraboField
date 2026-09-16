import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {ToastProvider} from 'react-native-toast-notifications';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useMeasurements from './useMeasurements';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import compassReducer from '../compass/compass.slice';
import connectionsReducer from '../connections/connections.slice';
import homeReducer from '../home/home.slice';
import notebookReducer from '../notebook-panel/notebook.slice';
import projectReducer from '../project/projects.slice';
import spotReducer from '../spots/spots.slice';

// A template prefills a new measurement, but the template form is the whole measurement form, so a template
// can hold a strike or dip of its own. Those must never overrule what the compass actually read.
describe('createNewMeasurement', () => {
  const spotId = 1756000000001;
  const spot = {properties: {id: spotId, name: 'Spot 08'}, type: 'Feature'};

  const reading = {dip: 40, dip_direction: 130, manual: false, plunge: 20, quality: 'good', rake: 5, strike: 350,
    trend: 10};

  const getState = (activeMeasurementTemplates, measurementTypes) => ({
    compass: {measurements: reading, measurementTypes: measurementTypes},
    project: {
      datasets: {12: {id: 12, modified_timestamp: 1, name: 'Dataset 1', spotIds: [spotId]}},
      project: {
        modified_timestamp: 1,
        templates: {activeMeasurementTemplates: activeMeasurementTemplates, useMeasurementTemplates: true},
      },
    },
    spot: {selectedSpot: spot, selectedAttributes: [], spots: {[spotId]: spot}},
  });

  const createMeasurement = (activeMeasurementTemplates,
    measurementTypes = [COMPASS_TOGGLE_BUTTONS.PLANAR]) => {
    const store = configureStore({
      preloadedState: getState(activeMeasurementTemplates, measurementTypes),
      reducer: {
        compass: compassReducer,
        connections: connectionsReducer,
        home: homeReducer,
        notebook: notebookReducer,
        project: projectReducer,
        spot: spotReducer,
      },
    });
    let measurementsApi;
    const Probe = () => {
      measurementsApi = useMeasurements();
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <Provider store={store}>
          <ToastProvider>
            <Probe/>
          </ToastProvider>
        </Provider>,
      );
    });
    ReactTestRenderer.act(() => measurementsApi.createNewMeasurement());
    return store.getState().spot.selectedSpot.properties.orientation_data[0];
  };

  // The bug this guards: the template used to be applied after the reading, so a stale strike silently
  // replaced the one just measured and the Spot recorded an angle nobody took
  it('keeps the measured strike and dip when a template carries its own', () => {
    const template = {id: 't1', name: 'Bedding', values: {dip: 5, strike: 100, type: 'planar_orientation'}};
    const measurement = createMeasurement([template]);
    expect(measurement.strike).toBe(reading.strike);
    expect(measurement.dip).toBe(reading.dip);
  });

  it('keeps the measured quality when a template carries its own', () => {
    const template = {id: 't1', name: 'Bedding', values: {quality: 'poor', type: 'planar_orientation'}};
    expect(createMeasurement([template]).quality).toBe(reading.quality);
  });

  it('keeps the measured trend and plunge on a linear measurement', () => {
    const template = {id: 't1', name: 'Lineation', values: {plunge: 80, trend: 200, type: 'linear_orientation'}};
    const measurement = createMeasurement([template], [COMPASS_TOGGLE_BUTTONS.LINEAR]);
    expect(measurement.trend).toBe(reading.trend);
    expect(measurement.plunge).toBe(reading.plunge);
  });

  // The whole point of a template: everything the reading does not supply still comes through
  it('still takes the fields a template is actually for', () => {
    const template = {
      id: 't1',
      name: 'Bedding',
      values: {feature_type: 'bedding', strike: 100, type: 'planar_orientation'},
    };
    expect(createMeasurement([template]).feature_type).toBe('bedding');
  });

  it('records the reading when there is no template at all', () => {
    const measurement = createMeasurement([]);
    expect(measurement.strike).toBe(reading.strike);
    expect(measurement.dip).toBe(reading.dip);
  });

  // Narrow, but the branch states an intent that the assignment used to undo: this template is only found as
  // a tabular one through its subType, so its own stale values.type would have put itself back afterwards.
  // A values.type of planar or tabular cannot reach here at all - the planar finder claims it first.
  it('stays tabular when a tabular template carries a stale type of its own', () => {
    const template = {
      id: 't1',
      name: 'Zone',
      subType: 'tabular_orientation',
      values: {type: 'linear_orientation', unit: 'm'},
    };
    const measurement = createMeasurement([template]);
    expect(measurement.type).toBe('tabular_orientation');
    expect(measurement.unit).toBe('m');
  });

  it('gives the new measurement an id', () => {
    expect(typeof createMeasurement([]).id).toBe('string');
  });
});
