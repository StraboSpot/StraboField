import React, {useRef} from 'react';
import {Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import {setOrientationFieldValue} from './compass.helpers';
import compassStyles from './compass.styles';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SliderBar from '../../shared/ui/SliderBar';
import {FormikWrapper, NumberInputField} from '../form';
import {MODAL_KEYS} from '../page/pageKeys.constants';

const ManualMeasurement = ({
                             addAttributeMeasurement,
                             initialValues,
                             measurementTypes,
                             setAttributeMeasurements,
                             setSliderValue,
                             sliderValue,
                             validate,
                           }) => {
  /* Data Hooks */

  const modalVisible = useSelector(state => state.home.modalVisible);

  /* Local State */

  const manualFormRef = useRef(null);

  /* Event Handlers */

  // Entering a strike fills in the dip direction and the reverse, as it does for a planar measurement
  const setFieldValueAndPairedOrientation = (name, value) => setOrientationFieldValue(manualFormRef.current, name, value);

  /* View */

  return (
    <FormikWrapper
      enableReinitialize={true}
      initialValues={initialValues}
      innerRef={manualFormRef}
      validate={validate}
      validateOnMount={true}
    >
      {formProps => (
        <View>
          {measurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR) && (
            <>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <NumberInputField
                    label={'Strike'}
                    name={'strike'}
                    setFieldValueOverride={setFieldValueAndPairedOrientation}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <NumberInputField
                    label={'Azimuthal Dip Direction'}
                    name={'dip_direction'}
                    setFieldValueOverride={setFieldValueAndPairedOrientation}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <NumberInputField
                    label={'Dip'}
                    name={'dip'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
            </>
          )}
          {measurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR) && (
            <>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <NumberInputField
                    label={'Trend'}
                    name={'trend'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <NumberInputField
                    label={'Plunge'}
                    name={'plunge'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
            </>
          )}
          {setAttributeMeasurements && modalVisible !== MODAL_KEYS.SHORTCUTS.MEASUREMENT
            && modalVisible !== MODAL_KEYS.NOTEBOOK.MEASUREMENTS && (
              <>
                <View style={compassStyles.sliderContainer}>
                  <Text style={{...commonStyles.listItemTitle, fontWeight: 'bold'}}>Quality of Measurement</Text>
                  <SliderBar
                    labels={['Low', '', '', '', 'High', 'N/R']}
                    maximumValue={6}
                    minimumValue={1}
                    onSlidingComplete={setSliderValue}
                    step={1}
                    value={sliderValue}
                  />
                </View>
                <ActionButton
                  disabled={!isEmpty(formProps.errors)}
                  onPress={() => addAttributeMeasurement(formProps.values)}
                  title={'Add to Attribute'}
                />
              </>
            )}
        </View>
      )}
    </FormikWrapper>
  );
};

export default ManualMeasurement;
