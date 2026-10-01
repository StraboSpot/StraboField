import React, {useState} from 'react';

import MicroProjectPDFOverlay from './MicroProjectPDFOverlay';
import useMicro from './useMicro';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';

// Opens a StraboMicro project's PDF. It is downloaded when the sample is linked, and again here if that didn't happen.
const MicroProjectPDFLink = ({projectId}) => {
  /* Data Hooks */

  const {downloadMicroProjectIfMissing} = useMicro();

  /* Local State */

  const [doc, setDoc] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  /* Event Handlers */

  const onPress = async () => {
    try {
      setIsLoading(true);
      setDoc(await downloadMicroProjectIfMissing(projectId));
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
        icon={{color: PRIMARY_ACCENT_COLOR, name: 'document-text-outline', size: 20, type: 'ionicon'}}
        iconContainerStyle={{position: 'absolute', left: 15}}
        loading={isLoading}
        onPress={onPress}
        title={'View StraboMicro Project PDF'}
      />
      <MicroProjectPDFOverlay doc={doc} setVisible={setIsVisible} visible={isVisible}/>
    </>
  );
};

export default MicroProjectPDFLink;
