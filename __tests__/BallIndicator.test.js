import React from 'react';
import {Animated, StyleSheet} from 'react-native';

import ReactTestRenderer from 'react-test-renderer';

import BallIndicator from '../src/shared/ui/BallIndicator';

// The balls are the Animated.Views; each sits in a rotated layer of its own
const getBallStyles = renderer => renderer.root.findAll(node => node.type === Animated.View && node.props.style?.borderRadius !== undefined)
  .map(node => StyleSheet.flatten(node.props.style));

describe('BallIndicator', () => {
  it('draws 8 balls sized from the size prop', async () => {
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BallIndicator color={'darkgrey'} size={40}/>);
    });
    const ballStyles = getBallStyles(renderer);
    expect(ballStyles).toHaveLength(8);
    expect(ballStyles[0]).toMatchObject({backgroundColor: 'darkgrey', borderRadius: 4, height: 8, margin: 2, width: 8});
  });

  it('stops its animation when it unmounts', async () => {
    const stop = jest.fn();
    const loop = jest.spyOn(Animated, 'loop').mockReturnValue({start: jest.fn(), stop});
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BallIndicator color={'darkgrey'} size={40}/>);
    });
    expect(stop).not.toHaveBeenCalled();
    await ReactTestRenderer.act(() => renderer.unmount());
    expect(stop).toHaveBeenCalledTimes(1);
    loop.mockRestore();
  });
});
