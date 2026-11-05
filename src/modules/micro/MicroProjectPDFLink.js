import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';

import {useSelector} from 'react-redux';

import MicroProjectPDFOverlay from './MicroProjectPDFOverlay';
import useMicro from './useMicro';
import useDevice from '../../services/device/useDevice';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import sampleStyles from '../samples/samples.styles';

// Opens a StraboMicro project's PDF. It is downloaded when the sample is linked, and again here if that didn't happen
// or the project has changed on the server since. Offline, only a saved copy can be opened.
const MicroProjectPDFLink = ({projectId}) => {
  /* Data Hooks */

  const {isConnected, isInternetReachable} = useSelector(state => state.connections.isOnline);
  const {doesMicroProjectPDFExist} = useDevice();
  const {downloadMicroProjectIfMissingOrOutdated} = useMicro();

  /* Local State */

  const [doc, setDoc] = useState({});
  const [hasSavedCopy, setHasSavedCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  /* Derived Variables */

  const isDisabled = !hasSavedCopy && !(isConnected && isInternetReachable);

  /* Side Effects */

  useEffect(() => {
    let isCurrent = true;
    doesMicroProjectPDFExist(projectId)
      .then(exists => isCurrent && setHasSavedCopy(exists))
      .catch(() => isCurrent && setHasSavedCopy(false));
    return () => {
      isCurrent = false;
    };
  }, [projectId, isLoading]);

  /* Event Handlers */

  const onPress = async () => {
    try {
      setIsLoading(true);
      setDoc(await downloadMicroProjectIfMissingOrOutdated(projectId));
      setIsVisible(true);
    }
    catch (err) {
      console.error('Error getting StraboMicro project PDF', err);
      alert('Uh Oh!', 'The StraboMicro project PDF is not on this device and could not be downloaded. Check your'
        + ' connection and try again.');
    }
    finally {
      setIsLoading(false);
    }
  };

  /* View */

  return (
    <>
      <OutlineButton
        disabled={isDisabled}
        icon={{color: PRIMARY_ACCENT_COLOR, name: 'document-text-outline', size: 20, type: 'ionicon'}}
        iconContainerStyle={{position: 'absolute', left: 15}}
        loading={isLoading}
        onPress={onPress}
        title={'View StraboMicro Project PDF'}
      />
      {isDisabled && <Text style={sampleStyles.offlineNote}>Opening the PDF needs an internet connection</Text>}
      <MicroProjectPDFOverlay doc={doc} setVisible={setIsVisible} visible={isVisible}/>
    </>
  );
};

export default MicroProjectPDFLink;
