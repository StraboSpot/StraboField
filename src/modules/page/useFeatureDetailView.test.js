import React from 'react';

import {configureStore} from '@reduxjs/toolkit';
import {Provider, useSelector} from 'react-redux';
import ReactTestRenderer from 'react-test-renderer';

import useFeatureDetailView from './useFeatureDetailView';
import homeReducer from '../home/home.slice';
import {openFeatureInNotebook} from '../notebook-panel/notebook.helpers';
import notebookReducer, {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import projectReducer, {setMultipleFeaturesTaggingEnabled} from '../project/projects.slice';
import spotReducer, {setSelectedAttributes, setSelectedSpot} from '../spots/spots.slice';

// A detail view shows the feature in the Redux selection, so it must close whenever that selection is dropped -
// otherwise it stays open over a feature from another Spot or page, and saving writes that feature in here.
describe('useFeatureDetailView', () => {
  const fabric = {id: 'fabric-1', type: 'fault_rock'};

  const renderHook = () => {
    const store = configureStore({
      reducer: {home: homeReducer, notebook: notebookReducer, project: projectReducer, spot: spotReducer},
    });
    store.dispatch(setSelectedSpot({properties: {id: 1}}));
    let hookApi;
    const Probe = () => {
      hookApi = useFeatureDetailView();
      return null;
    };
    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Provider store={store}><Probe/></Provider>);
    });
    const dispatch = action => ReactTestRenderer.act(() => {
      store.dispatch(action);
    });
    return {dispatch, getHook: () => hookApi, renderer, store};
  };

  const getSelection = store => store.getState().spot.selectedAttributes;

  it('opens a feature and puts it in the selection', () => {
    const {getHook, store} = renderHook();
    expect(getHook().isDetailView).toBe(false);
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    expect(getHook().isDetailView).toBe(true);
    expect(getHook().selectedFeature).toEqual(fabric);
    expect(getSelection(store)).toEqual([fabric]);
  });

  it('opens a feature selected from somewhere else', () => {
    const {dispatch, getHook} = renderHook();
    dispatch(setSelectedAttributes([fabric]));
    expect(getHook().isDetailView).toBe(true);
    expect(getHook().selectedFeature).toEqual(fabric);
  });

  it('shows the updated record when the selection is edited elsewhere', () => {
    const {dispatch, getHook} = renderHook();
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    dispatch(setSelectedAttributes([{...fabric, label: 'Edited'}]));
    expect(getHook().selectedFeature.label).toBe('Edited');
  });

  it('closes when another Spot is selected', () => {
    const {dispatch, getHook} = renderHook();
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    dispatch(setSelectedSpot({properties: {id: 2}}));
    expect(getHook().isDetailView).toBe(false);
  });

  it('closes when the notebook goes to another page', () => {
    const {dispatch, getHook} = renderHook();
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    dispatch(setNotebookPageVisible('notes'));
    expect(getHook().isDetailView).toBe(false);
  });

  it('drops the selection when closed', () => {
    const {getHook, store} = renderHook();
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    ReactTestRenderer.act(() => getHook().closeDetailView());
    expect(getHook().isDetailView).toBe(false);
    expect(getSelection(store)).toEqual([]);
  });

  it('leaves the list showing while several features are selected for tagging', () => {
    const {dispatch, getHook} = renderHook();
    dispatch(setMultipleFeaturesTaggingEnabled(true));
    dispatch(setSelectedAttributes([fabric, {id: 'fabric-2'}]));
    expect(getHook().isDetailView).toBe(false);
  });

  it('opens a feature from another page even if tagging was left on there', () => {
    const {dispatch, getHook} = renderHook();
    dispatch(setMultipleFeaturesTaggingEnabled(true));
    dispatch(setNotebookPageVisible('fabrics'));
    dispatch(setSelectedAttributes([fabric]));
    expect(getHook().isDetailView).toBe(true);
  });

  describe('a feature handed over from another list page', () => {
    const renderNotebook = () => {
      const store = configureStore({
        reducer: {home: homeReducer, notebook: notebookReducer, project: projectReducer, spot: spotReducer},
      });
      store.dispatch(setSelectedSpot({properties: {id: 1}}));
      store.dispatch(setNotebookPageVisible('minerals'));
      const hook = {};
      const Probe = () => {
        hook.api = useFeatureDetailView();
        return null;
      };
      // Keyed by page like the notebook's own pages, so the page left unmounts as the next one mounts
      const Notebook = () => <Probe key={useSelector(state => state.notebook.visibleNotebookPagesStack.slice(-1)[0])}/>;
      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<Provider store={store}><Notebook/></Provider>);
      });
      return {hook, store};
    };

    it('opens on the next page', () => {
      const {hook, store} = renderNotebook();
      ReactTestRenderer.act(() => hook.api.openDetailView({id: 'mineral-1'}));
      ReactTestRenderer.act(() => openFeatureInNotebook(store.dispatch, 'fabrics', fabric));
      expect(hook.api.isDetailView).toBe(true);
      expect(hook.api.selectedFeature).toEqual(fabric);
    });

    // A sed rock is a lithology seen through one tab, so its link hands the Lithologies page the very feature it has open
    it('opens on the next page when it is the feature the page left had open', () => {
      const {hook, store} = renderNotebook();
      ReactTestRenderer.act(() => hook.api.openDetailView(fabric));
      ReactTestRenderer.act(() => openFeatureInNotebook(store.dispatch, 'fabrics', hook.api.selectedFeature));
      expect(hook.api.isDetailView).toBe(true);
      expect(hook.api.selectedFeature).toEqual(fabric);
    });
  });

  it('drops the selection when the page closes', () => {
    const {getHook, renderer, store} = renderHook();
    ReactTestRenderer.act(() => getHook().openDetailView(fabric));
    ReactTestRenderer.act(() => renderer.unmount());
    expect(getSelection(store)).toEqual([]);
  });
});
