import React, {useEffect, useRef, useState} from 'react';
import {ScrollView} from 'react-native';

import Clipboard from '@react-native-clipboard/clipboard';
import JSONTree from 'react-native-json-tree';
import Toast from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import ClearButton from '../../shared/ui/buttons/ClearButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setModalVisible} from '../home/home.slice';

const SpotsRawDataView = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const project = useSelector(state => state.project.project);
  const selectedSpots = useSelector(state => state.spot.intersectedSpotsForTagging);

  /* Local State */

  const toast = useRef(null);

  const [dataJson, setDataJson] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('Selected Spots', selectedSpots);
    buildObject();
  }, [selectedSpots]);

  /* Event Handlers */

  const onClipboardPress = () => {
    Clipboard.setString(JSON.stringify(selectedSpots));
    toast.current.show('Copied to clipboard', {data: {title: 'noWifi', message: 'hello'}});
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
      isFullScreen
      overlayStylesOverride={{width: '90%', height: '80%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <ScrollView>
        <ClearButton
          onPress={onClipboardPress}
          title={'Copy JSON to Clipboard'}
        />
        <JSONTree
          data={dataJson}
          hideRoot
        />
      </ScrollView>
      <Toast ref={toast}/>
    </ModalWrapper>
  );
};

export default SpotsRawDataView;
