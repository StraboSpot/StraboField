import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import JSONTree from 'react-native-json-tree';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setModalVisible} from '../home/home.slice';

const SpotsRawDataView = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);
  const toast = useToast();

  /* Local State */

  const [dataJson, setDataJson] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('Selected Spots', selectedSpots);
    buildObject();
  }, [selectedSpots]);

  /* Event Handlers */

  const onClipboardPress = () => {
    Clipboard.setString(JSON.stringify(selectedSpots));
    toast.show('Copied to clipboard');
  };

  /* Logic Helpers */

  const buildObject = () => {
    const filteredDataJson = {
      Project: {project},
      Spots: {selectedSpots},
    };
    console.log(filteredDataJson);
    setDataJson(filteredDataJson);
  };

  const closeModal = () => {
    dispatch(setModalVisible({modal: null}));
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      isChildrenFilled
      overlayStyleOverride={{width: '90%', maxHeight: '80%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <ClearButton
        onPress={onClipboardPress}
        title={'Copy JSON to Clipboard'}
      />
      <ScrollView style={{flex: 1}}>
        <JSONTree
          data={dataJson}
          hideRoot
        />
      </ScrollView>
    </ModalWrapper>
  );
};

export default SpotsRawDataView;
