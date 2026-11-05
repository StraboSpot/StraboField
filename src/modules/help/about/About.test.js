import React from 'react';

import ReactTestRenderer from 'react-test-renderer';

import About from './About';

let mockVersion;

jest.mock('../../../shared/app.constants', () => ({
  get VERSION_NUMBER() {
    return mockVersion;
  },
}));
jest.mock('../../../shared/ui/modals/ModalWrapper', () => 'ModalWrapper');

const renderAbout = (version) => {
  mockVersion = version;
  let renderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<About/>);
  });
  return renderer.root;
};

const getModalText = (root) => {
  const texts = root.findByType('ModalWrapper').findAll(node => typeof node.props.children === 'string'
    || Array.isArray(node.props.children));
  return texts.map(node => [].concat(node.props.children).filter(c => typeof c === 'string').join('')).join('\n');
};

// A test build's placeholder version has no notes of its own, so it shows the newest release's and says so
it('shows the newest notes and says the features match for a test build', () => {
  const root = renderAbout('100.0.0');
  expect(root.findByProps({name: 'information-circle-outline'})).toBeTruthy();
  const modalText = getModalText(root);
  expect(modalText).toContain('All new features are the same as the 2.33.0 build.');
  expect(modalText).toContain('2.33.0');
  expect(modalText).not.toContain('2.32.1');
});

// A new release whose notes are not written yet is not a test build, so it borrows nothing and has no button
it('treats a release version with no notes yet as an ordinary release', () => {
  const root = renderAbout('2.34.0');
  expect(root.findAllByProps({name: 'information-circle-outline'})).toHaveLength(0);
  expect(getModalText(root)).not.toContain('All new features are the same');
});

it('shows its own notes without the test build line for a release version', () => {
  const root = renderAbout('2.33.0');
  expect(getModalText(root)).not.toContain('All new features are the same');
  expect(getModalText(root)).toContain('2.33.0');
});
