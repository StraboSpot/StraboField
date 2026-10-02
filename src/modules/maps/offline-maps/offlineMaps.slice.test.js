import offlineMapsReducer, {
  clearedMapsFromRedux,
  clearedOfflineMapPreview,
  deletedOfflineMap,
  setOfflineMapsFromImport,
  startedOfflineMapPreview,
} from './offlineMaps.slice';

const topo = {id: 'mapbox.outdoors', name: 'Topo', count: 1420};
const satellite = {id: 'mapbox.satellite', name: 'Satellite', count: 880};

const stateWith = (maps, previewedOfflineMapId = null) => ({
  offlineMaps: Object.fromEntries(maps.map(map => [map.id, map])),
  previewedOfflineMapId: previewedOfflineMapId,
});

describe('startedOfflineMapPreview', () => {
  it('marks the map being previewed', () => {
    const state = offlineMapsReducer(stateWith([topo, satellite]), startedOfflineMapPreview(topo.id));
    expect(state.previewedOfflineMapId).toBe(topo.id);
  });

  // Only one map ever stands in for the basemap, so choosing another replaces it rather than adding to it
  it('replaces the map already being previewed', () => {
    const state = offlineMapsReducer(stateWith([topo, satellite], topo.id), startedOfflineMapPreview(satellite.id));
    expect(state.previewedOfflineMapId).toBe(satellite.id);
  });

  it('leaves the maps themselves untouched', () => {
    const state = offlineMapsReducer(stateWith([topo, satellite]), startedOfflineMapPreview(topo.id));
    expect(state.offlineMaps).toEqual({[topo.id]: topo, [satellite.id]: satellite});
  });
});

describe('clearedOfflineMapPreview', () => {
  it('ends the preview', () => {
    const state = offlineMapsReducer(stateWith([topo], topo.id), clearedOfflineMapPreview());
    expect(state.previewedOfflineMapId).toBeNull();
  });

  // Dispatched at launch and on every basemap change, where usually nothing is being previewed
  it('does nothing when no map is being previewed', () => {
    const state = stateWith([topo, satellite]);
    expect(offlineMapsReducer(state, clearedOfflineMapPreview())).toEqual(state);
  });
});

// An id can outlive the map it names, which a flag stored on the map itself could not
describe('a preview whose map goes away', () => {
  it('ends when that map is deleted', () => {
    const state = offlineMapsReducer(stateWith([topo, satellite], topo.id), deletedOfflineMap(topo.id));
    expect(state.previewedOfflineMapId).toBeNull();
  });

  it('survives another map being deleted', () => {
    const state = offlineMapsReducer(stateWith([topo, satellite], topo.id), deletedOfflineMap(satellite.id));
    expect(state.previewedOfflineMapId).toBe(topo.id);
  });

  it('ends when every map is cleared', () => {
    const state = offlineMapsReducer(stateWith([topo], topo.id), clearedMapsFromRedux());
    expect(state.previewedOfflineMapId).toBeNull();
  });

  it('ends when an import replaces the maps without it', () => {
    const state = offlineMapsReducer(stateWith([topo], topo.id), setOfflineMapsFromImport({[satellite.id]: satellite}));
    expect(state.previewedOfflineMapId).toBeNull();
  });

  it('survives an import that brings it back', () => {
    const state = offlineMapsReducer(stateWith([topo], topo.id), setOfflineMapsFromImport({[topo.id]: topo}));
    expect(state.previewedOfflineMapId).toBe(topo.id);
  });
});
