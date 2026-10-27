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
import FormikWrapper from '../form/FormikWrapper';
import NumberInputField from '../form/inputs/NumberInputField';
import {MODAL_KEYS} from '../page/pageKeys.constants';

// Formik keeps no values at all without initial ones, and the first write then fails. This is one object rather than
// a fresh {} per render, which enableReinitialize would take as new initial values and clear what was typed.
const NO_INITIAL_VALUES = {};

const ManualMeasurement = ({
                             addAttributeMeasurement,
                             initialValues = NO_INITIAL_VALUES,
                             measurementTypes,
                             setAttributeMeasurements,
                             setSliderValue,
                             sliderValue,
                             validate,
                           }) => {
  /* Data Hooks */

  const activeModal = useSelector(state => state.home.activeModal);

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
          {setAttributeMeasurements && activeModal !== MODAL_KEYS.SHORTCUTS.MEASUREMENT
            && activeModal !== MODAL_KEYS.NOTEBOOK.MEASUREMENTS && (
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
