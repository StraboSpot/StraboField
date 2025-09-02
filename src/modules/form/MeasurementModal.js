import React, {useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {formStyles, useForm} from '.';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN, WARNING_COLOR} from '../../shared/styles.constants';
import ModalWrapperHeader from '../../shared/ui/modal/ModalWrapperHeader';
import SliderBar from '../../shared/ui/SliderBar';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import Compass from '../compass/Compass';
import compassStyles from '../compass/compass.styles';
import ManualMeasurement from '../compass/ManualMeasurement';
import overlayStyles from '../home/overlays/overlay.styles';

const MeasurementModal = ({
                            formName,
                            formProps,
                            measurementsGroup,
                            measurementsGroupLabel,
                            setIsMeasurementModalVisible,
                          }) => {
  const {height} = useWindowSize();

  const compassMeasurementTypes = useSelector(state => state.compass.measurementTypes);

  const [isManualMeasurement, setIsManualMeasurement] = useState(Platform.OS !== 'ios');
  const [sliderValue, setSliderValue] = useState(6);

  const {getChoices, getChoicesByKey, getSurvey} = useForm();

  const addAttributeMeasurement = (data) => {
    const sliderQuality = sliderValue ? {quality: sliderValue.toString()} : undefined;
    setMeasurements({...data, ...sliderQuality});
    setIsMeasurementModalVisible(false);
  };

  const setMeasurements = (compassData) => {
    let renamedCompassData = {};
    if (isEmpty(compassData)) {
      let updatedFormData = JSON.parse(JSON.stringify(formProps.values));
      Object.values(measurementsGroup).forEach((k) => {
        if (isEmpty(compassData) && updatedFormData[k]) delete updatedFormData[k];
      });
      formProps.setValues(updatedFormData);
      setIsMeasurementModalVisible(false);
    }
    else {
      Object.entries(measurementsGroup).forEach(([compassFieldKey, foldFieldKey]) => {
        if (!isEmpty(compassData[compassFieldKey])) {
          // Convert quality to choice names for fold group, assumes qualities listed highest to lowest
          if (compassFieldKey === 'quality') {
            const survey = getSurvey(formName);
            const choices = getChoices(formName);
            const qualityChoices = getChoicesByKey(survey, choices, foldFieldKey);
            const choiceNum = Math.round(parseInt(compassData[compassFieldKey], 10) / 5 * qualityChoices.length);
            renamedCompassData[foldFieldKey] = qualityChoices.reverse()[choiceNum - 1]?.name;
          }
          else renamedCompassData[foldFieldKey] = compassData[compassFieldKey];
        }
      });
      formProps.setValues({...formProps.values, ...renamedCompassData});
    }
  };

  return (
    <Overlay
      overlayStyle={
        SMALL_SCREEN
          ? overlayStyles.overlayContainerFullScreen
          : [{...overlayStyles.overlayContainer, height: 0.60}, overlayStyles.overlayPosition]
      }
      supportedOrientations={['portrait', 'landscape']}
      isVisible={true}
      fullScreen={SMALL_SCREEN}
    >
      <ModalWrapperHeader
        buttonTitleRight={'Done'}
        title={measurementsGroupLabel}
        closeModal={() => setIsMeasurementModalVisible(false)}
      />
      {Platform.OS === 'ios' && (
        <Button
          buttonStyle={formStyles.formButtonSmall}
          titleProps={formStyles.formButtonTitle}
          title={isManualMeasurement ? 'Switch to Compass Input' : 'Manually Add Measurement'}
          type={'clear'}
          onPress={() => setIsManualMeasurement(!isManualMeasurement)}
        />
      )}
      {isManualMeasurement ? (
        <ManualMeasurement
          addAttributeMeasurement={addAttributeMeasurement}
          setAttributeMeasurements={setMeasurements}
          measurementTypes={compassMeasurementTypes}
          setSliderValue={setSliderValue}
          sliderValue={sliderValue}
        />
      ) : (
        <>
          <Compass
            setAttributeMeasurements={setMeasurements}
            closeCompass={() => setIsMeasurementModalVisible(false)}
            sliderValue={sliderValue}
          />
          <View style={compassStyles.sliderContainer}>
            <Text style={{...commonStyles.listItemTitle, fontWeight: 'bold'}}>Quality of Measurement</Text>
            <SliderBar
              onSlidingComplete={setSliderValue}
              value={sliderValue}
              step={1}
              maximumValue={6}
              minimumValue={1}
              labels={['Low', '', '', '', 'High', 'N/R']}
            />
          </View>
        </>
      )}
      <Button
        titleStyle={{color: WARNING_COLOR}}
        title={'Clear Measurement'}
        type={'clear'}
        onPress={() => setMeasurements({})}
      />
    </Overlay>
  );
};

export default MeasurementModal;
