import React from 'react';
import {ScrollView} from 'react-native';

import JSONTree from 'react-native-json-tree';

import ModalWrapper from './ModalWrapper';
import CopyToClipboardButton from '../buttons/CopyToClipboardButton';

// hideRoot hides the root, so the first visible level is 1
// Level 1: the top-level keys
// Level 2: their contents, listed but not opened
const shouldExpandNode = (keyName, data, level) => level <= 1;

// 40% reads well on a desktop but is too narrow on a tablet in portrait, so minWidth holds a readable floor and
// maxWidth keeps a margin at the narrowest sizes. With isChildrenFilled, maxHeight becomes a fixed height on open
// so expanding a node can't resize the modal.
const OVERLAY_STYLE = {maxHeight: '80%', maxWidth: '90%', minWidth: 600, width: '40%'};

// A read-only JSON tree in a modal, with a button that copies what the tree shows.
const JsonTreeModal = ({closeModal, data, headerTitle}) => (
  <ModalWrapper
    closeModal={closeModal}
    headerTitle={headerTitle}
    isChildrenFilled
    overlayStyleOverride={OVERLAY_STYLE}
    showActionButton={false}
    showCancelButton={false}
    showCloseButton={true}
  >
    <CopyToClipboardButton getText={() => JSON.stringify(data)}/>
    <ScrollView style={{flex: 1}}>
      <JSONTree data={data} hideRoot shouldExpandNode={shouldExpandNode}/>
    </ScrollView>
  </ModalWrapper>
);

export default JsonTreeModal;
