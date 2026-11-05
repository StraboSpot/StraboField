import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {ListItem, Slider} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import SwitchWrapper from '../../shared/ui/SwitchWrapper';
import {setSnapping} from '../maps/maps.slice';

const SLIDER_CONFIG = {maximumValue: 50, minimumValue: 5, step: 5};

const SnapToSpots = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const snapping = useSelector(state => state.map.snapping);

  const {isOn, pixelTolerance} = snapping;

  /* Local State */

  const [isVisible, setIsVisible] = useState(false);
  const [sliderValue, setSliderValue] = useState(pixelTolerance);

  /* Side Effects */

  useEffect(() => {
    setSliderValue(pixelTolerance);
  }, [pixelTolerance]);

  /* Event Handlers */

  const onSlidingComplete = value => dispatch(setSnapping({pixelTolerance: value}));

  const onSwitchValueChange = () => dispatch(setSnapping({isOn: !isOn}));

  /* View */

  return (
    <>
      <SectionDivider dividerText={'Snapping'} subtitle={'Join new and moved vertices to nearby Spots'}/>
      <ListItem containerStyle={commonStyles.listItem}>
        <ListItem.Content>
          <ListItem.Title style={commonStyles.listItemTitle}>Snap to Spots</ListItem.Title>
        </ListItem.Content>
        <SwitchWrapper onValueChange={onSwitchValueChange} value={isOn}/>
      </ListItem>
      <OutlineButton
        disabled={!isOn}
        onPress={() => setIsVisible(true)}
        title={`Snap Tolerance (${pixelTolerance} px)`}
      />

      <ModalWrapper
        closeModal={() => setIsVisible(false)}
        headerTitle={'Snap Tolerance'}
        isVisible={isVisible}
        overlayStyleOverride={{width: 350, height: 'auto'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={{padding: 20}}>
          <Text style={{marginBottom: 15, textAlign: 'center'}}>
            A vertex placed or moved this close to a Spot on the map snaps onto the Spot's nearest vertex, or its
            nearest edge if no vertex is that close. Applies to tapped vertices, the ends of Freehand strokes and
            vertices moved while editing.
          </Text>
          <Text style={{...commonStyles.importantText, marginTop: 20}}>
            {`${sliderValue} px`}
          </Text>
          <Slider
            allowTouchTrack
            maximumValue={SLIDER_CONFIG.maximumValue}
            minimumValue={SLIDER_CONFIG.minimumValue}
            onSlidingComplete={onSlidingComplete}
            onValueChange={setSliderValue}
            step={SLIDER_CONFIG.step}
            style={{alignSelf: 'center', marginVertical: 10, width: '90%'}}
            thumbStyle={{backgroundColor: PRIMARY_ACCENT_COLOR, height: 25, width: 25}}
            value={sliderValue}
          />
        </View>
      </ModalWrapper>
    </>
  );
};

export default SnapToSpots;
