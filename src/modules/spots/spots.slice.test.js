import spotReducer, {editedOrCreatedSpots, restoredIntervalDragSnapshot, setSelectedAttributes} from './spots.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';

describe('editedOrCreatedSpots', () => {
  const spot = {properties: {id: 1756000000001, name: 'Spot 1', orientation_data: [{id: 'm1', strike: 45}]}};
  const spotEdited = {
    properties: {...spot.properties, orientation_data: [{id: 'm1', dip_direction: 135, strike: 45}]},
  };

  it('saves the edited Spot', () => {
    const state = {selectedSpot: {}, spots: {[spot.properties.id]: spot}};
    const {spots} = spotReducer(state, editedOrCreatedSpots([spotEdited]));
    expect(spots[spot.properties.id].properties.orientation_data[0].dip_direction).toBe(135);
  });

  it('refreshes the selected Spot, which is what an open Notebook page renders', () => {
    const state = {selectedSpot: spot, spots: {[spot.properties.id]: spot}};
    const {selectedSpot} = spotReducer(state, editedOrCreatedSpots([spotEdited]));
    expect(selectedSpot.properties.orientation_data[0].dip_direction).toBe(135);
  });

  it('leaves a selected Spot that was not edited alone', () => {
    const otherSpot = {properties: {id: 1756000000002, name: 'Spot 2'}};
    const state = {selectedSpot: otherSpot, spots: {[otherSpot.properties.id]: otherSpot}};
    const {selectedSpot} = spotReducer(state, editedOrCreatedSpots([spotEdited]));
    expect(selectedSpot).toEqual(otherSpot);
  });
});

describe('restoredIntervalDragSnapshot', () => {
  const spot = {properties: {id: 1756000000001, interval_thickness: 10, name: 'Spot 1'}};
  const spotDragged = {properties: {...spot.properties, interval_thickness: 25}};

  it('puts the Spot back as it was before the drag', () => {
    const state = {selectedSpot: {}, spots: {[spot.properties.id]: spotDragged}};
    const {spots} = spotReducer(state, restoredIntervalDragSnapshot([spot]));
    expect(spots[spot.properties.id].properties.interval_thickness).toBe(10);
  });

  // Web cancels a drag with this alone, so nothing else is left to refresh an open Notebook page
  it('refreshes the selected Spot, which is what an open Notebook page renders', () => {
    const state = {selectedSpot: spotDragged, spots: {[spot.properties.id]: spotDragged}};
    const {selectedSpot} = spotReducer(state, restoredIntervalDragSnapshot([spot]));
    expect(selectedSpot.properties.interval_thickness).toBe(10);
  });

  it('leaves a selected Spot outside the strat section alone', () => {
    const otherSpot = {properties: {id: 1756000000002, name: 'Spot 2'}};
    const state = {selectedSpot: otherSpot, spots: {[otherSpot.properties.id]: otherSpot}};
    const {selectedSpot} = spotReducer(state, restoredIntervalDragSnapshot([spot]));
    expect(selectedSpot).toEqual(otherSpot);
  });
});

// The notebook swaps one page component for another, so a page mounts reading whatever is in the store and used
// to open a detail view over a record belonging to the page just left - which then saved that record's fields
// into this page's data, since a save only strips the fields its own survey declares.
describe('selectedAttributes on changing the notebook page', () => {
  const measurement = {id: 'm1', label: 'Planar Feature - BEDDING', strike: 45};

  it('drops the features selected on the page being left', () => {
    const state = {selectedAttributes: [measurement]};
    const {selectedAttributes} = spotReducer(state, setNotebookPageVisible(PAGE_KEYS.DIAGENESIS));
    expect(selectedAttributes).toEqual([]);
  });

  // Opening a feature from another page's list sets the page first and the feature second, so the clear lands
  // before the selection rather than wiping it
  it('keeps a feature selected after the page it belongs to is opened', () => {
    let state = {selectedAttributes: [{id: 'old'}]};
    state = spotReducer(state, setNotebookPageVisible(PAGE_KEYS.MEASUREMENTS));
    state = spotReducer(state, setSelectedAttributes([measurement]));
    expect(state.selectedAttributes).toEqual([measurement]);
  });
});
