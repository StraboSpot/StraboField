import React from 'react';

import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Provider} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import BasicSedPage from '../src/modules/sed/BasicSedPage';
import TephraPage from '../src/modules/tephra/TephraPage';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({navigate: () => {}, addListener: () => () => {}}),
}));

const getStore = (spot, selectedAttribute) => {
  // Built once: a new object per getState call would hand every selector a new value and never settle
  const state = {
    connections: {isOnline: {isInternetReachable: true}, databaseEndpoint: {endpoint: undefined, isSelected: false}},
    home: {modalValues: {}, modalVisible: null},
    map: {stratSection: undefined, currentBasemap: undefined},
    project: {project: {}, datasets: {}},
    spot: {selectedSpot: spot, selectedAttributes: [selectedAttribute]},
    user: {sesar: {userCodes: [], selectedUserCode: undefined, sesarToken: {}}},
  };
  return {getState: () => state, subscribe: () => () => {}, dispatch: action => action};
};

// The tab bar, kept apart from the form below it: the fields carry their own required asterisks, so reading the
// whole tree would find 'Primary Lithology *' and take it for a marked Lithology tab
const getTabBar = (node) => {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) return node.reduce((acc, child) => acc || getTabBar(child), undefined);
  if (node.props?.testID === 'RNE__ButtonGroupContainer') return node;
  return getTabBar(node.children);
};

const getText = (node, text = []) => {
  if (node === null || node === undefined || typeof node === 'boolean') return text;
  if (typeof node === 'string' || typeof node === 'number') text.push(String(node));
  else if (Array.isArray(node)) node.forEach(child => getText(child, text));
  else if (node.children) node.children.forEach(child => getText(child, text));
  return text;
};

// Open a feature's detail view, optionally moving to another tab and typing there, and report what the tab bar
// says and whether Save is being held
const openDetail = async ({page, spot, selectedAttribute, tabIndex}) => {
  const settle = async () => ReactTestRenderer.act(async () => {});
  let renderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{frame: {x: 0, y: 0, width: 400, height: 800}, insets: {top: 0, bottom: 0, left: 0, right: 0}}}
      >
        <Provider store={getStore(spot, selectedAttribute)}>
          {page}
        </Provider>
      </SafeAreaProvider>,
    );
  });
  await settle();
  if (tabIndex) {
    const tabs = renderer.root.findAll(n => n.props?.testID === 'RNE__ButtonGroupItem' && n.props?.onPress);
    await ReactTestRenderer.act(() => tabs[tabIndex].props.onPress());
    await settle();
    // Typing on the tab revalidates, which is where the fields of the tab left behind used to drop out
    const inputs = renderer.root.findAll(n => n.props?.onChangeText);
    await ReactTestRenderer.act(() => inputs[0].props.onChangeText('typed on this tab'));
    await settle();
  }
  const markedTabs = getText(getTabBar(renderer.toJSON())).join('');
  const isSaveHeld = renderer.root.findAll(n => n.props?.title === 'Save' && n.props?.disabled !== undefined)
    .some(n => n.props.disabled);
  // Torn down before the test ends, or the lists it holds go on updating and logging afterwards
  await ReactTestRenderer.act(() => renderer.unmount());
  return {isSaveHeld, markedTabs};
};

describe('lithology tabs', () => {
  // A lithology is only required to answer anything when its Spot is an interval mapped on a strat section
  const getIntervalSpot = lithology => ({
    geometry: {type: 'Point', coordinates: [0, 0]},
    properties: {
      id: 1,
      name: 'Interval 1',
      strat_section_id: 1,
      surface_feature: {surface_feature_type: 'strat_interval'},
      sed: {character: 'bed', lithologies: [lithology]},
    },
  });

  const openLithology = lithology => openDetail({
    page: <BasicSedPage isReadOnly={false} page={{key: 'lithologies', label: 'Lithologies'}}/>,
    selectedAttribute: lithology,
    spot: getIntervalSpot(lithology),
  });

  it('marks Texture, where the grain size a sandstone has to answer lives', async () => {
    const {isSaveHeld, markedTabs} = await openLithology(
      {id: 'lith-1', primary_lithology: 'siliciclastic', siliciclastic_type: 'sandstone'});
    expect(markedTabs).toContain('Texture *');
    expect(markedTabs).not.toContain('Lithology *');
    expect(markedTabs).not.toContain('Composition *');
    expect(markedTabs).not.toContain('Stratification *');
    expect(isSaveHeld).toBe(true);
  });

  it('marks Lithology while the lithology itself is the field still to be answered', async () => {
    const {markedTabs} = await openLithology({id: 'lith-1'});
    expect(markedTabs).toContain('Lithology *');
    expect(markedTabs).not.toContain('Texture *');
  });

  it('marks no tab once every field the interval asks for is answered', async () => {
    const {isSaveHeld, markedTabs} = await openLithology(
      {id: 'lith-1', primary_lithology: 'siliciclastic', siliciclastic_type: 'sandstone', sand_grain_size: 'coarse'});
    expect(markedTabs).toContain('Texture');
    expect(markedTabs).not.toContain('*');
    expect(isSaveHeld).toBe(false);
  });
});

describe('tephra tabs', () => {
  const openLayer = (layer, tabIndex) => openDetail({
    page: <TephraPage isReadOnly={false} page={{key: 'tephra', label: 'Tephra'}}/>,
    selectedAttribute: layer,
    spot: {geometry: {type: 'Point', coordinates: [0, 0]}, properties: {id: 1, name: 'Spot 1', tephra: [layer]}},
    tabIndex: tabIndex,
  });

  const FILLED_LAYER = {id: 't1', label: 'Layer 1', layer_type: 'fall', thickness_units: 'cm', thickness_typical: 10};

  it('marks Basic, which asks for the layer type, while Additional is the tab being filled in', async () => {
    const {isSaveHeld, markedTabs} = await openLayer({id: 't2', label: 'Layer 2'}, 1);
    expect(markedTabs).toContain('Basic *');
    expect(markedTabs).not.toContain('Additional *');
    expect(isSaveHeld).toBe(true);
  });

  it('marks no tab once the Basic tab is answered, from either tab', async () => {
    expect((await openLayer(FILLED_LAYER)).markedTabs).not.toContain('*');
    const {isSaveHeld, markedTabs} = await openLayer(FILLED_LAYER, 1);
    expect(markedTabs).toContain('Basic');
    expect(markedTabs).not.toContain('*');
    expect(isSaveHeld).toBe(false);
  });
});
