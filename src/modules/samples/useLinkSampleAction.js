import {useEffect, useState} from 'react';

import {useToast} from 'react-native-toast-notifications';

import useSamples from './useSamples';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';

// Linking and unlinking the sample open in the notebook, shared by wherever the Link Sample button is shown: a rich
// sample's overview, or the notebook footer for a sample kept on its parent Spot. Only the footer can have a sample
// form open beside it, so only it passes the form's unsaved changes to be saved first.
const useLinkSampleAction = (sampleChangesRef) => {
  /* Data Hooks */

  const toast = useToast();
  const {getSelectedSample, unlinkSample} = useSamples();

  /* Local State */

  const [isLinkSampleModalVisible, setIsLinkSampleModalVisible] = useState(false);
  // Unlinking is made on the render after it is asked for, so it starts from the sample as any save just stored it
  const [isUnlinkPending, setIsUnlinkPending] = useState(false);

  /* Derived Variables */

  const isLinked = !isEmpty(getSelectedSample()?.strabosamples_id);

  /* Side Effects */

  useEffect(() => {
    if (isUnlinkPending) {
      setIsUnlinkPending(false);
      unlinkSample();
      toast.show('Sample unlinked from StraboSamples', {type: 'success'});
    }
  }, [isUnlinkPending]);

  /* Logic Helpers */

  // Linking and unlinking both rewrite the sample as stored, so changes still open in the sample form are saved first,
  // or the sample is left as it is. A linked sample is unlinked; any other opens the picker to link it.
  const linkOrUnlinkSample = () => {
    const isUnlinking = isLinked;
    const openSampleForm = sampleChangesRef?.current;
    // The picker waits out an alert still closing, since iOS drops a modal presented while another is dismissing
    const continueLinking = (modalDelay) => {
      if (isUnlinking) setIsUnlinkPending(true);
      else setTimeout(() => setIsLinkSampleModalVisible(true), modalDelay);
    };
    if (!openSampleForm?.getHasUnsavedChanges()) continueLinking(0);
    else {
      alert('Unsaved Changes', `This sample has changes that need to be saved before it can be ${isUnlinking
        ? 'unlinked' : 'linked'}. Save them now?`,
        [{
          text: 'Cancel',
          style: 'cancel',
        }, {
          text: 'OK',
          onPress: async () => {
            if (await openSampleForm.saveChanges()) continueLinking(400);
          },
        }],
        {cancelable: false},
      );
    }
  };

  return {
    closeLinkSampleModal: () => setIsLinkSampleModalVisible(false),
    isLinkSampleModalVisible: isLinkSampleModalVisible,
    isLinked: isLinked,
    linkOrUnlinkSample: linkOrUnlinkSample,
  };
};

export default useLinkSampleAction;
