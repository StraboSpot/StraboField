import React from 'react';
import {Text} from 'react-native';

import * as Sentry from '@sentry/react-native';
import ReactTestRenderer from 'react-test-renderer';

import AppErrorFallback from '../src/shared/ui/AppErrorFallback';

// The root boundary in App.js: an error nothing else caught shows AppErrorFallback instead of tearing the app down,
// and Try Again brings the app back.

let shouldThrow;
const Child = () => {
  if (shouldThrow) throw new Error('render failed');
  return <Text>App content</Text>;
};

const renderErrorFallback = props => <AppErrorFallback {...props}/>;

const getTexts = renderer => renderer.root.findAllByType(Text).map(node => [].concat(node.props.children).join(''));

describe('root error boundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => console.error.mockRestore());

  it('shows the fallback for a render error, and Try Again restores the app', async () => {
    shouldThrow = true;
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Sentry.GlobalErrorBoundary fallback={renderErrorFallback}><Child/></Sentry.GlobalErrorBoundary>);
    });
    expect(getTexts(renderer)).toContain('Something went wrong');
    expect(getTexts(renderer)).not.toContain('App content');

    shouldThrow = false;
    const tryAgain = renderer.root.find(node => node.props.accessibilityRole === 'button' && node.props.onPress);
    await ReactTestRenderer.act(() => tryAgain.props.onPress());
    expect(getTexts(renderer)).toContain('App content');
  });

  it('leaves the app alone when nothing throws', async () => {
    shouldThrow = false;
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Sentry.GlobalErrorBoundary fallback={renderErrorFallback}><Child/></Sentry.GlobalErrorBoundary>);
    });
    expect(getTexts(renderer)).toEqual(['App content']);
  });
});
