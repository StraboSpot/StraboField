import React from 'react';
import {ScrollView, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import ModalWrapper from './ModalWrapper';
import overlayStyles from './overlay.styles';
import {closedMessageModal} from '../../../modules/home/home.slice';

// Reports the outcome of an action, success or failure alike, for hooks and services that can't render a modal
// themselves. Title and message both come from the slice, so callers own the wording. Kept separate from
// statusMessages, which ~100 unrelated callers write to.
const MessageModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isVisible, message, title} = useSelector(state => state.home.messageModal);

  /* Logic Helpers */

  const closeModal = () => dispatch(closedMessageModal());

  /* View */

  return (
    <ModalWrapper
      actionTitle={'Ok'}
      closeModal={closeModal}
      headerTitle={title}
      isContentSized
      isVisible={isVisible}
      onActionPressed={closeModal}
      overlayStyleOverride={{maxHeight: 300, paddingHorizontal: 0}}
      showCancelButton={false}
      showCloseButton
    >
      <View style={{alignSelf: 'stretch', flexGrow: 0, paddingHorizontal: 10}}>
        <ScrollView style={{flexGrow: 0}}>
          <Text style={overlayStyles.statusMessageText}>{message}</Text>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default MessageModal;
