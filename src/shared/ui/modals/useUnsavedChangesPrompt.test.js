import React from 'react';
import {Platform} from 'react-native';

import ReactTestRenderer from 'react-test-renderer';

import {UNSAVED_CHANGES_CHOICES} from './unsavedChanges.constants';
import useUnsavedChangesPrompt from './useUnsavedChangesPrompt';

// The action waiting on the prompt may open a modal of its own, which iOS drops while the prompt is still closing,
// so the answer must wait for the prompt to close there and only there
describe('useUnsavedChangesPrompt', () => {
  const renderHook = () => {
    let hookApi;
    const Probe = () => {
      hookApi = useUnsavedChangesPrompt();
      return null;
    };
    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<Probe/>);
    });
    return () => hookApi;
  };

  // Asks, chooses, and reports what the asker had heard before the prompt closed and after
  const askAndChoose = async (getHook, choice) => {
    let answer;
    await ReactTestRenderer.act(async () => {
      getHook().askAboutUnsavedChanges().then((value) => {
        answer = value;
      });
    });
    expect(getHook().promptProps.isVisible).toBe(true);
    await ReactTestRenderer.act(async () => getHook().promptProps.onChoose(choice));
    const answerBeforeDismiss = answer;
    await ReactTestRenderer.act(async () => getHook().promptProps.onDismiss());
    return {answer, answerBeforeDismiss};
  };

  afterEach(() => jest.restoreAllMocks());

  it('answers on iOS once the prompt has closed', async () => {
    const getHook = renderHook();
    const {answer, answerBeforeDismiss} = await askAndChoose(getHook, UNSAVED_CHANGES_CHOICES.DISCARD);
    expect(answerBeforeDismiss).toBeUndefined();
    expect(answer).toBe(UNSAVED_CHANGES_CHOICES.DISCARD);
    expect(getHook().promptProps.isVisible).toBe(false);
  });

  it('holds back a second ask while the prompt is open', async () => {
    const getHook = renderHook();
    let firstAnswer;
    let secondAnswer;
    await ReactTestRenderer.act(async () => {
      getHook().askAboutUnsavedChanges().then((value) => {
        firstAnswer = value;
      });
      secondAnswer = await getHook().askAboutUnsavedChanges();
    });
    expect(secondAnswer).toBe(UNSAVED_CHANGES_CHOICES.KEEP_EDITING);
    await ReactTestRenderer.act(async () => getHook().promptProps.onChoose(UNSAVED_CHANGES_CHOICES.SAVE));
    await ReactTestRenderer.act(async () => getHook().promptProps.onDismiss());
    expect(firstAnswer).toBe(UNSAVED_CHANGES_CHOICES.SAVE);
  });

  it('answers elsewhere as soon as a choice is made', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const getHook = renderHook();
    const {answer, answerBeforeDismiss} = await askAndChoose(getHook, UNSAVED_CHANGES_CHOICES.SAVE);
    expect(answerBeforeDismiss).toBe(UNSAVED_CHANGES_CHOICES.SAVE);
    expect(answer).toBe(UNSAVED_CHANGES_CHOICES.SAVE);
  });
});
