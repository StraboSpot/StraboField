import React, {useRef} from 'react';
import {Text, View} from 'react-native';

import {Field, Formik} from 'formik';
import {ListItem} from 'react-native-elements';
import {useSelector} from 'react-redux';

import {COMPASS_TOGGLE_BUTTONS} from './compass.constants';
import compassStyles from './compass.styles';
import commonStyles from '../../shared/common.styles';
import SaveButton from '../../shared/SaveButton';
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
    <React.Fragment>
      <Formik
        initialValues={{}}
        onSubmit={values => console.log('Submitting form...', values)}
        innerRef={manualFormRef}
        enableReinitialize={true}
      >
        {formProps => (
          <View>
            {measurementTypes.includes(COMPASS_TOGGLE_BUTTONS.PLANAR) && (
              <React.Fragment>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <Field
                      component={NumberInputField}
                      name={'strike'}
                      label={'Strike'}
                      key={'strike'}
                    />
                  </ListItem.Content>
                </ListItem>
                <FlatListItemSeparator/>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <Field
                      component={NumberInputField}
                      name={'dip_direction'}
                      label={'Azimuthal Dip Direction'}
                      key={'dip_direction'}
                    />
                  </ListItem.Content>
                </ListItem>
                <FlatListItemSeparator/>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <Field
                      component={NumberInputField}
                      name={'dip'}
                      label={'Dip'}
                      key={'dip'}
                    />
                  </ListItem.Content>
                </ListItem>
                <FlatListItemSeparator/>
              </React.Fragment>
            )}
            {measurementTypes.includes(COMPASS_TOGGLE_BUTTONS.LINEAR) && (
              <React.Fragment>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <Field
                      component={NumberInputField}
                      name={'trend'}
                      label={'Trend'}
                      key={'trend'}
                    />
                  </ListItem.Content>
                </ListItem>
                <FlatListItemSeparator/>
                <ListItem containerStyle={commonStyles.listItemFormField}>
                  <ListItem.Content>
                    <Field
                      component={NumberInputField}
                      name={'plunge'}
                      label={'Plunge'}
                      key={'plunge'}
                    />
                  </ListItem.Content>
                </ListItem>
                <FlatListItemSeparator/>
              </React.Fragment>
            )}
            {setAttributeMeasurements && modalVisible !== MODAL_KEYS.SHORTCUTS.MEASUREMENT
              && modalVisible !== MODAL_KEYS.NOTEBOOK.MEASUREMENTS && (
                <>
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
                    <SaveButton
                      title={'Add to Attribute'}
                      onPress={() => addAttributeMeasurement(formProps.values)}
                    />
                  </View>
                </>
              )}
          </View>
        )}
      </Formik>
    </React.Fragment>
  );
};

export default ManualMeasurement;
