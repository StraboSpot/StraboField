import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {ButtonGroup, Slider} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import drawGeometryTogglesStyles from './drawGeometryToggles.styles';
import commonStyles from '../../shared/common.styles';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setFreehandVertexSpacing} from '../maps/maps.slice';

const FEET_PER_METER = 3.28084;
const UNIT_BUTTONS_TEXT = ['Pixels', 'Distance'];

// Slider bounds per unit (distance values are in the user's scale-bar unit).
const SLIDER_CONFIG = {
  pixels: {maximumValue: 50, minimumValue: 5, step: 5},
  metric: {maximumValue: 500, minimumValue: 25, step: 25},
  imperial: {maximumValue: 1500, minimumValue: 75, step: 75},
};

const FreehandVertexSpacing = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const freehandVertexSpacing = useSelector(state => state.map.freehandVertexSpacing);
  const isScaleBarMetric = useSelector(state => state.map.isScaleBarMetric);

  const {distanceSpacing, pixelSpacing, unit} = freehandVertexSpacing;
  const isPixels = unit === 'pixels';
  const distanceLabel = isScaleBarMetric ? 'm' : 'ft';

  // Distance is stored in meters; show it in the user's scale-bar unit.
  const distanceDisplayValue = isScaleBarMetric ? distanceSpacing : Math.round(distanceSpacing * FEET_PER_METER);
  const displayValue = isPixels ? pixelSpacing : distanceDisplayValue;
  const displayUnit = isPixels ? 'px' : distanceLabel;

  const sliderConfig = isPixels ? SLIDER_CONFIG.pixels
    : isScaleBarMetric ? SLIDER_CONFIG.metric : SLIDER_CONFIG.imperial;

  /* Local State */

  const [isVisible, setIsVisible] = useState(false);
  const [sliderValue, setSliderValue] = useState(displayValue);

  /* Side Effects */

  useEffect(() => {
    setSliderValue(displayValue);
  }, [displayValue]);

  /* Event Handlers */

  const onSlidingComplete = (value) => {
    if (isPixels) dispatch(setFreehandVertexSpacing({pixelSpacing: value}));
    else {
      const meters = isScaleBarMetric ? value : value / FEET_PER_METER;
      dispatch(setFreehandVertexSpacing({distanceSpacing: Math.round(meters * 100) / 100}));
    }
  };

  const onUnitPressed = i => dispatch(setFreehandVertexSpacing({unit: i === 0 ? 'pixels' : 'distance'}));

  /* View */

  return (
    <>
      <OutlineButton
        onPress={() => setIsVisible(true)}
        title={`Freehand Vertex Spacing (${displayValue} ${displayUnit})`}
      />

      <ModalWrapper
        closeModal={() => setIsVisible(false)}
        headerTitle={'Freehand Vertex Spacing'}
        isVisible={isVisible}
        overlayStyleOverride={{width: 350, height: 'auto'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={{padding: 20}}>
          <Text style={{marginBottom: 15, textAlign: 'center'}}>
            Sets the minimum spacing between vertices when drawing lines or polygons with Freehand. Larger values
            make fewer, more widely-spaced vertices that are easier to edit.
          </Text>
          <ButtonGroup
            buttons={UNIT_BUTTONS_TEXT}
            containerStyle={drawGeometryTogglesStyles.drawGeometrySwitch}
            onPress={onUnitPressed}
            selectedButtonStyle={drawGeometryTogglesStyles.selectedButton}
            selectedIndex={isPixels ? 0 : 1}
            textStyle={drawGeometryTogglesStyles.buttonGroupText}
          />
          <Text style={{...commonStyles.importantText, marginTop: 20}}>
            {`${sliderValue} ${displayUnit}`}
          </Text>
          <Slider
            allowTouchTrack
            maximumValue={sliderConfig.maximumValue}
            minimumValue={sliderConfig.minimumValue}
            onSlidingComplete={onSlidingComplete}
            onValueChange={setSliderValue}
            step={sliderConfig.step}
            style={{alignSelf: 'center', marginVertical: 10, width: '90%'}}
            thumbStyle={{backgroundColor: PRIMARY_ACCENT_COLOR, height: 25, width: 25}}
            value={sliderValue}
          />
        </View>
      </ModalWrapper>
    </>
  );
};

export default FreehandVertexSpacing;
