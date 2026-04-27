import React from 'react';
import {ActivityIndicator, Text, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import RockdLogo from '../../../assets/images/logos/rockd_transparent.png';
import {setMacrostratToken} from '../../../modules/user/userProfile.slice';
import OutlineButton from '../../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import useServerRequests from '../../useServerRequests';

const RockdModal = ({closeModal, isVisible}) => {
  const dispatch = useDispatch();
  const {convertSpotToMacrostrat, openMacrostratLogin} = useServerRequests();

  const macrostratToken = useSelector(state => state.user.macrostrat?.token);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const [statusMessage, setStatusMessage] = React.useState('');

  // useEffect(() => {
  //   console.log('macrostratToken', macrostratToken);
  //   convertSpot().then((r) => {
  //     sendSpot();
  //   });
  // }, [macrostratToken]);

  if (macrostratToken) {
    convertSpot();
  }

  const convertSpot = async () => {
    console.log('convertSpot', selectedSpot);
    setStatusMessage('Converting Spot to Rock\'d Spot...');
    const response = await convertSpotToMacrostrat(selectedSpot);
    console.log('convertSpot response', response);
  };

  // const sendSpot = async () => {
  //   console.log('sendSpot', selectedSpot);
  //   setStatusMessage('Sending Spot to Rock\'d...');
  // };

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerImage={RockdLogo}
      imageStyle={{height: 75, width: 200, marginBottom: 20}}
      imageStyleOverride={{
        height: 75,
        width: 200,
        marginBottom: 20,
      }}
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
        {macrostratToken ? (
          <View style={{alignItems: 'center', gap: 12}}>
            <ActivityIndicator size='large'/>
            <Text style={{fontSize: 16, textAlign: 'center'}}>
              {statusMessage}
            </Text>
          </View>
        ) : (
          <OutlineButton
            onPress={openMacrostratLogin}
            title={'Login to Rock\'d'}
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
