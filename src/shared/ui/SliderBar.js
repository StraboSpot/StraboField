import React from 'react';
import {Text, View} from 'react-native';

import Slider from './Slider';
import uiStyles from './ui.styles';
import * as themes from '../styles.constants';

const SliderBar = ({
                     disabled = false,
                     isHideLabels,
                     labels,
                     maximumValue,
                     minimumValue,
                     onSlidingComplete,
                     onValueChange,
                     rotateLabels,
                     step,
                     thumbTintColor,
                     value,
                   }) => {
  return (
    <>
      <Slider
        disabled={disabled}
        maximumTrackTintColor={themes.MEDIUMGREY}
        maximumValue={maximumValue}
        minimumTrackTintColor={themes.MEDIUMGREY}
        minimumValue={minimumValue}
        onSlidingComplete={onSlidingComplete}
        onValueChange={onValueChange}
        step={step || 1}
        style={uiStyles.slider}
        thumbStyle={{height: 20, width: 20}}
        thumbTintColor={thumbTintColor || themes.DARKGREY}
        value={value}
      />
      {!isHideLabels && (
        <View style={[uiStyles.sliderTextContainer, rotateLabels && {paddingTop: 10, paddingBottom: 10}]}>
          {labels?.map((label, index) => {
            return (
              <Text
                key={label + index}
                style={[uiStyles.sliderLabel, rotateLabels && {transform: [{rotate: '290deg'}], marginLeft: -12}]}
              >
                {label}
              </Text>
            );
          })}
        </View>
      )}
    </>
  );
};

export default SliderBar;
