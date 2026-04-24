import React from 'react';
import {Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import RockdLogo from '../../../assets/images/logos/Rockd_logo.png';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import useServerRequests from '../../useServerRequests';

const RockdModal = ({closeModal, isVisible, checkInTransmitState}) => {
  const {openMacrostratLogin} = useServerRequests();

  const macrostratToken = useSelector(state => state.user.macrostrat?.token);

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerImage={RockdLogo}
      isVisible={isVisible}
      onBackdropPress={closeModal}
      overlayStyleOverride={{
        height: 'auto',
        width: '80%',
        maxWidth: 400,
      }}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <View style={{alignItems: 'center'}}>
        {macrostratToken && (
          <Text
            style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center'}}>
            {checkInTransmitState || 'Log in to Rock\'d to Check-In'}
          </Text>
        )}
      </View>
      {macrostratToken && (
        <OutlineButton
          checkInTransmitState={checkInTransmitState}
          onPress={openMacrostratLogin}
          title={'Login to Rock\'d'}
        />
      )}
    </ModalWrapper>
  );
};

export default RockdModal;
