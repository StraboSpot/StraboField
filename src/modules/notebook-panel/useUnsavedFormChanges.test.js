import React from 'react';

import ReactTestRenderer from 'react-test-renderer';

import {LeavePageContext, useUnsavedFormChanges} from './LeavePageContext';

// What a page tells the gate about its form. Getting it wrong either asks about changes already saved or thrown away,
// or lets the page be left with changes nobody was asked about.
describe('useUnsavedFormChanges', () => {
  const renderHook = ({getSaveHeldReason, isAsking, onDiscard} = {}) => {
    const form = {dirty: false, errors: {}, resetForm: jest.fn(), status: {formName: []}, values: {note: ''}};
    let openPage = null;
    const leavePage = {
      registerOpenPage: (owner, page) => {
        openPage = page;
      },
      reportOpenPageChanged: () => {},
      unregisterOpenPage: () => {
        openPage = null;
      },
    };
    let hookApi;
    const Probe = () => {
      hookApi = useUnsavedFormChanges({
        formRef: {current: form},
        getMessage: () => 'Your note hasn\'t been saved.',
        getSaveHeldReason: getSaveHeldReason,
        isAsking: isAsking,
        onDiscard: onDiscard,
        save: async () => true,
      });
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeavePageContext.Provider value={leavePage}><Probe/></LeavePageContext.Provider>);
    });
    return {form, getHook: () => hookApi, getOpenPage: () => openPage};
  };

  const type = (form, note) => {
    form.dirty = true;
    form.values = {note: note};
  };

  it('reports a changed form as unsaved until it is marked saved', () => {
    const {form, getHook, getOpenPage} = renderHook();
    expect(getOpenPage().getHasUnsavedChanges()).toBe(false);
    type(form, 'typed');
    expect(getOpenPage().getHasUnsavedChanges()).toBe(true);
    getHook().markSaved();
    expect(getOpenPage().getHasUnsavedChanges()).toBe(false);
  });

  it('asks again about changes made after a save', () => {
    const {form, getHook, getOpenPage} = renderHook();
    type(form, 'typed');
    getHook().markSaved();
    type(form, 'typed more');
    expect(getOpenPage().getHasUnsavedChanges()).toBe(true);
  });

  it('puts the form back on Discard, and asks no more about what it threw away', () => {
    const {form, getOpenPage} = renderHook();
    type(form, 'typed');
    getOpenPage().discard();
    expect(form.resetForm).toHaveBeenCalled();
    expect(getOpenPage().getHasUnsavedChanges()).toBe(false);
  });

  it('runs the page\'s own Discard in place of resetting the form', () => {
    const onDiscard = jest.fn();
    const {form, getOpenPage} = renderHook({onDiscard});
    type(form, 'typed');
    getOpenPage().discard();
    expect(onDiscard).toHaveBeenCalled();
    expect(form.resetForm).not.toHaveBeenCalled();
    expect(getOpenPage().getHasUnsavedChanges()).toBe(false);
  });

  // Errors hold Save only while they hold the page's own Save button, which is what isFormInvalid reports
  it('lists the form\'s errors while they hold the page\'s Save', () => {
    const {form, getHook, getOpenPage} = renderHook();
    form.errors = {site_safety_coordinator: 'Required'};
    expect(getOpenPage().getSaveHeldReasons()).toEqual([]);
    ReactTestRenderer.act(() => getHook().setIsFormInvalid(true));
    expect(getOpenPage().getSaveHeldReasons()).toEqual(['site safety coordinator: Required']);
  });

  it('lists the page\'s own reason for holding Save first', () => {
    const {form, getHook, getOpenPage} = renderHook({getSaveHeldReason: () => 'Please sign in to SESAR to save.'});
    form.errors = {strike: 'Required'};
    ReactTestRenderer.act(() => getHook().setIsFormInvalid(true));
    expect(getOpenPage().getSaveHeldReasons()).toEqual(['Please sign in to SESAR to save.', 'strike: Required']);
  });

  it('registers nothing for a form that is not asked about', () => {
    const {getOpenPage} = renderHook({isAsking: false});
    expect(getOpenPage()).toBeNull();
  });
});
