import React from 'react';
import {ScrollView} from 'react-native';

import JSONTree from 'react-native-json-tree';
import {useDispatch, useSelector} from 'react-redux';

import CopyToClipboardButton from '../../shared/ui/buttons/CopyToClipboardButton';
import {JSON_MODAL_STYLE} from '../../shared/ui/modals/modal.styles';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setModalVisible} from '../home/home.slice';

// hideRoot hides the root, so the first visible level is 1
// Level 1: Project, Spots
// Level 2: the project's fields and the selected Spots, listed but not opened
const shouldExpandNode = (keyName, data, level) => level <= 1;

const SpotsRawDataView = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  /* Derived Variables */

  const dataJson = {Project: project, Spots: selectedSpots};

  /* Logic Helpers */

  const closeModal = () => {
    dispatch(setModalVisible({modal: null}));
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      isChildrenFilled
      overlayStyleOverride={JSON_MODAL_STYLE}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <CopyToClipboardButton getText={() => JSON.stringify(selectedSpots)}/>
      <ScrollView style={{flex: 1}}>
        <JSONTree
          data={dataJson}
          hideRoot
          shouldExpandNode={shouldExpandNode}
        />
      </ScrollView>
    </ModalWrapper>
  );
};

export default SpotsRawDataView;
