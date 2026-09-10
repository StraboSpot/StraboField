import React from 'react';
import {Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import RockdLogo from '../../../assets/images/logos/rockd_transparent.png';
import {updatedModifiedTimestampsBySpotsIds} from '../../../modules/project/projects.slice';
import {editedSpotProperties} from '../../../modules/spots/spots.slice';
import {addedCheckedInSpotId, setMacrostratToken} from '../../../modules/user/userProfile.slice';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import LottieAnimations from '../../../utils/animations/LottieAnimations';
import useServerRequests from '../../network/useServerRequests';

const STATUS_MESSAGES = {
  converting: 'Converting spot to Rockd format...',
  sending: 'Sending check-in to Rockd...',
  success: 'Successfully checked in to Rockd!',
};

const RockdModal = ({closeModal, isVisible}) => {
  const dispatch = useDispatch();
  const {convertSpotToMacrostrat, openMacrostratLogin, postCheckinToRockd} = useServerRequests();

  const macrostratToken = useSelector(state => state.user.macrostrat?.token);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const [checkInStatus, setCheckInStatus] = React.useState('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const isLoading = checkInStatus === 'converting' || checkInStatus === 'sending';

  React.useEffect(() => {
    if (macrostratToken && selectedSpot && isVisible) {
      handleCheckIn();
    }
  }, [macrostratToken, isVisible]);

  const handleCheckIn = async () => {
    try {
      console.log('RockdModal check-in CONVERTING');
      setCheckInStatus('converting');
      const converted = await convertSpotToMacrostrat(selectedSpot);
      if (!converted) throw new Error('Conversion returned an empty result');

      console.log('RockdModal check-in SENDING');
      setCheckInStatus('sending');
      const checkInResponse = await postCheckinToRockd({...converted, token: macrostratToken});

      console.log('RockdModal check-in SUCCESS', checkInResponse);
      dispatch(addedCheckedInSpotId(selectedSpot.properties.id));
      dispatch(updatedModifiedTimestampsBySpotsIds([selectedSpot.properties.id]));
      dispatch(
        editedSpotProperties({
          field: 'rockd_checkin_id',
          value: checkInResponse?.success?.data?.checkin_id,
        }),
      );
      setCheckInStatus('success');
    }
    catch (err) {
      console.error('RockdModal check-in error', err);
      setErrorMessage(err?.message ?? 'An unknown error occurred');
      setCheckInStatus('error');
    }
  };

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerImage={RockdLogo}
      imageStyle={{height: 100, width: 250, marginBottom: 20}}
      isVisible={isVisible}
      onBackdropPress={closeModal}
      overlayStyleOverride={{height: 'auto', width: '80%', maxWidth: 400}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={true}
    >
      <View style={{alignItems: 'center', gap: 12}}>
        {macrostratToken ? (
          <>
            {checkInStatus !== 'idle' && (
              <LottieAnimations
                doesLoop={isLoading}
                type={isLoading ? 'uploading' : checkInStatus === 'error' ? 'error' : 'complete'}
              />
            )}
            <Text style={{fontSize: 16, textAlign: 'center'}}>
              {checkInStatus === 'error' ? errorMessage : STATUS_MESSAGES[checkInStatus]}
            </Text>
            {checkInStatus === 'error' && (
              <OutlineButton onPress={handleCheckIn} title={'Retry'}/>
            )}
          </>
        ) : (
          <OutlineButton
            onPress={openMacrostratLogin}
            title={'Login to Rockd'}
          />
        )}
        {__DEV__ && (
          <OutlineButton
            onPress={() => dispatch(setMacrostratToken({token: null, expires: null}))}
            title={'[DEV] Clear Rockd Token'}
          />
        )}
      </View>
    </ModalWrapper>
  );
};

export default RockdModal;
