import React, {useRef} from 'react';
import {Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import compassStyles from './compass.styles';
import commonStyles from '../../shared/common.styles';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SliderBar from '../../shared/ui/SliderBar';
import {NumberInputField} from '../form';
import {MODAL_KEYS} from '../page/page.constants';

const ManualMeasurement = ({
                             addAttributeMeasurement,
                             measurementTypes,
                             setAttributeMeasurements,
                             setSliderValue,
                             sliderValue,
                           }) => {
  const modalVisible = useSelector(state => state.home.modalVisible);

  const manualFormRef = useRef(null);

  return (
    <Formik
      enableReinitialize={true}
      initialValues={{}}
      innerRef={manualFormRef}
      onSubmit={values => console.log('Submitting form...', values)}
    >
      {formProps => (
        <View>
          {measurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR) && (
            <>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={NumberInputField}
                    key={'strike'}
                    label={'Strike'}
                    name={'strike'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={NumberInputField}
                    key={'dip_direction'}
                    label={'Azimuthal Dip Direction'}
                    name={'dip_direction'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={NumberInputField}
                    key={'dip'}
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
                  <Field
                    component={NumberInputField}
                    key={'trend'}
                    label={'Trend'}
                    name={'trend'}
                  />
                </ListItem.Content>
              </ListItem>
              <FlatListItemSeparator/>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={NumberInputField}
                    key={'plunge'}
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
                  <ActionButton onPress={() => addAttributeMeasurement(formProps.values)} title={'Add to Attribute'}/>
                </View>
              </>
            )}
        </View>
      )}
    </Formik>
  );
};

export default ManualMeasurement;
