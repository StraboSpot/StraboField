import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';

import {Image, Slider} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import styles from './preferences.styles';
import commonStyles from '../../shared/common.styles';
import {convertMillisecondsToTime, convertSliderValueToMilliseconds} from '../../shared/Helpers';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import uiStyles from '../../shared/ui/ui.styles';
import {setGeolocationTimeout} from '../home/home.slice';

const Geolocate = () => {
  const batteryImg = require('../../assets/icons/battery-full-outline.png');
  const dispatch = useDispatch();
  const currentTimeout = useSelector(state => state.home.geolocationTimeout);

  const [value, setValue] = useState(convertMillisecondsToSliderValue(currentTimeout));
  const [isGeolocationVisible, setIsGeolocationVisible] = useState(false);

  const labels = ['2 min', '5 min', '20 min', '40 min', 'ON'];

  useEffect(() => {
    setValue(convertMillisecondsToSliderValue(currentTimeout));
  }, [currentTimeout]);

  const color = () => {
    let r = interpolate(255, 0);
    let g = interpolate(0, 255);
    let b = interpolate(0, 0);
    return `rgb(${r},${g},${b})`;
  };

  function convertMillisecondsToSliderValue(milliseconds) {
    const timeMap = {
      [2 * 60 * 1000]: 0,
      [5 * 60 * 1000]: 1,
      [20 * 60 * 1000]: 2,
      [40 * 60 * 1000]: 3,
      [null]: 4,
    };
    return timeMap[milliseconds];
  }

  const interpolate = (start, end) => {
    let k = (value - 0) / 4; // 0 =>min  && 4 => MAX
    return Math.ceil((1 - k) * end + k * start) % 256;
  };

  const onSliderChange = (sliderValue) => {
    console.log('SLIDER CHANGE', sliderValue);
    const timeout = convertSliderValueToMilliseconds(sliderValue);
    console.log('TIMEOUT', timeout);
    dispatch(setGeolocationTimeout(timeout));
  };

  return (
    <>
      <OutlineButton
        onPress={() => setIsGeolocationVisible(!isGeolocationVisible)}
        title={`Geolocation Timeout (${convertMillisecondsToTime(currentTimeout)})`}
      />

      <ModalWrapper

        closeModal={() => setIsGeolocationVisible(false)}
        headerTitle={'Geolocation Options'}
        isVisible={isGeolocationVisible}
        overlayStyleOverride={{width: 350, height: 'auto'}}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <View style={{padding: 20}}>
          <Slider
            allowTouchTrack
            labelStyle={{marginLeft: 0}}
            maximumValue={4}
            minimumValue={0}
            onSlidingComplete={onSliderChange}
            onValueChange={setValue}
            rotateLabels
            step={1}
            style={{width: '90%', justifyContent: 'center', alignSelf: 'center', padding: 10, marginVertical: 10}}
            thumbProps={{
              children: (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Image source={batteryImg} style={{width: 30, height: 30}}/>
                </View>
              ),
            }}
            thumbStyle={{height: 30, width: 50, backgroundColor: color()}}
            // trackStyle={{height: 5, backgroundColor: 'transparent'}}
            value={convertMillisecondsToSliderValue(currentTimeout)}
          />
          <View style={styles.sliderLabelsContainer}>
            {labels?.map((label, index) => {
              const totalSteps = labels.length - 1;
              const position = (index / totalSteps) * 100;

              return (
                <Text
                  key={label + index}
                  style={[uiStyles.sliderLabel, styles.sliderLabelPositioned, {
                    left: `${position}%`,
                    transform: [{translateX: index === 0 ? 0 : index === totalSteps ? -20 : -10}, {rotate: '300deg'}],
                    marginLeft: 5,
                  }]}
                >
                  {label}
                </Text>
              );
            })}
          </View>
          <Text style={{marginTop: 30}}>
            <Text style={{...commonStyles.importantText, textAlign: 'left'}}>Note: </Text>
            Longer time limits can reduce battery life. Remember to turn off when not in use.</Text>
        </View>
      </ModalWrapper>
    </>
  );
};

export default Geolocate;
