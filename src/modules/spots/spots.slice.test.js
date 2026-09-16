import spotReducer, {editedOrCreatedSpots, restoredIntervalDragSnapshot} from './spots.slice';

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
