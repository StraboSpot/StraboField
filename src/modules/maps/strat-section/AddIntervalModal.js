import React, {useEffect, useRef, useState} from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import useStratSection from './useStratSection';
import useStratSectionCalculations from './useStratSectionCalculations';
import commonStyles from '../../../shared/common.styles';
import {deepObjectExtend} from '../../../shared/Helpers';
import alert from '../../../shared/ui/alert';
import ModalWrapper from '../../../shared/ui/modal/ModalWrapper';
import {Form, SelectInputField, TextInputField, useForm} from '../../form';
import {setModalValues, setModalVisible} from '../../home/home.slice';
import {updatedProject} from '../../project/projects.slice';
import {useSpots} from '../../spots';
import {setSelectedSpot} from '../../spots/spots.slice';

const AddIntervalModal = () => {
  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const stratSection = useSelector(state => state.map.stratSection);

  const [initialFormValues, setInitialFormValues] = useState({});
  const [intervalToCopy, setIntervalToCopy] = useState(null);

  const {getLabel, getSurvey, showErrors, validateForm} = useForm();
  const {createSpot, getIntervalSpotsThisStratSection} = useSpots();
  const {createInterval, orderStratSectionIntervals} = useStratSection();
  const {moveIntervalToAfter} = useStratSectionCalculations();

  const formRef = useRef(null);
  const preFormRef = useRef(null);

  const formName = ['sed', 'add_interval'];

  const intervals = getIntervalSpotsThisStratSection(stratSection.strat_section_id);

  useEffect(() => {
    const initialValues = {};
    if (stratSection.column_profile && stratSection.column_profile === 'clastic') {
      initialValues.interval_type = 'bed';
      initialValues.primary_lithology = 'siliciclastic';
    }
    else if (stratSection.column_profile && stratSection.column_profile === 'carbonate') {
      initialValues.interval_type = 'bed';
    }
    else if (stratSection.column_profile && stratSection.column_profile === 'mixed_clastic') {
      initialValues.interval_type = 'bed';
    }
    else if (stratSection.column_profile && stratSection.column_profile === 'basic_lithologies') {
      initialValues.interval_type = 'bed';
    }
    if (stratSection.column_y_axis_units) {
      initialValues.thickness_units = stratSection.column_y_axis_units;
      initialValues.package_thickness_units = stratSection.column_y_axis_units;
      initialValues.interbed_thickness_units = stratSection.column_y_axis_units;
    }

    // Testing Data
    /*      vm.intervalName = 'Interval Inserting';
     initialValues.interval_thickness = 2;
     // initialValues.character = 'bed';
     initialValues.primary_lithology = 'volcaniclastic';
     initialValues.interval_type = 'interbedded';
     //   initialValues.siliciclastic_type = 'claystone';
     initialValues.primary_lithology_1 = 'chert';
     initialValues.interbed_proportion = 30;
     initialValues.interbed_proportion_change = 'no_change';
     initialValues.avg_thickness = 5;
     initialValues.avg_thickness_1 = 8;*/

    setInitialFormValues(initialValues);
  }, []);

  const close = () => {
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: null}));
  };

  // Copy Sed Interval Lithology
  const copyIntervalLithology = (copyInterval) => {
    if (copyInterval?.properties?.sed) {
      setIntervalToCopy(JSON.parse(JSON.stringify(copyInterval)));
      const sedData = JSON.parse(JSON.stringify(copyInterval.properties.sed));
      let copiedData = extractAddIntervalData(sedData);
      delete copiedData.interval_thickness;
      setInitialFormValues(copiedData);
    }
    else setIntervalToCopy(null);
  };

  // Copy the Rest of the Sed Data
  const copyRestOfInterval = (interval) => {
    interval.properties.sed = deepObjectExtend(intervalToCopy.properties.sed, interval.properties.sed);
    setIntervalToCopy(null);
    return interval;
  };

  const doUnitsFieldsMatch = (data) => {
    if (stratSection.column_y_axis_units) {
      const unitsFields = ['thickness_units', 'interbed_thickness_units', 'package_thickness_units'];
      const mismatchUnitsField = unitsFields.find((unitsField) => {
        return data[unitsField] && stratSection.column_y_axis_units !== data[unitsField];
      });
      if (mismatchUnitsField) {
        alert(
          'Units Mismatch',
          'The units for the Y Axis are ' + stratSection.column_y_axis_units + ' but '
          + data[mismatchUnitsField] + ' have been designated for '
          + getLabel(mismatchUnitsField, formName) + '. Please fix the units for '
          + getLabel(mismatchUnitsField, formName) + '. Unit conversions may be added to a'
          + ' future version of the app.',
        );
        return false;
      }
    }
    return true;
  };

  // Extract the data from the Spot object in the format needed for the Add Interval modal
  const extractAddIntervalData = (sedData) => {
    const addIntervalSurvey = getSurvey(formName);
    const addIntervalFieldNames = addIntervalSurvey.map(f => f.name);
    let data = addIntervalFieldNames.reduce((obj, key) => {
      // Interval
      if (sedData.interval?.[key]) obj[key] = sedData.interval[key];
      // Lithologies
      else if (sedData.lithologies?.[0]?.[key]) obj[key] = sedData.lithologies[0][key];
      else if (key.endsWith('_1') && sedData.lithologies?.[1]?.[key.slice(0, -2)]) {
        obj[key] = sedData.lithologies[1][key.slice(0, -2)];
      }
      // Bedding
      else if (sedData.bedding?.[key]) obj[key] = sedData.bedding[key];
      else if (sedData.bedding?.beds?.[0]?.[key]) obj[key] = sedData.bedding.beds[0][key];
      else if (key.endsWith('_1') && sedData.bedding?.beds?.[1]?.[key.slice(0, -2)]) {
        obj[key] = sedData.bedding.beds[1][key.slice(0, -2)];
      }
      // Character
      else if (key === 'interval_type' && sedData.character) obj[key] = sedData.character;
      return obj;
    }, {});
    return data;
  };

  const renderAddIntervalNameField = () => {
    const initialIntervalName = {
      intervalName: (preferences.spot_prefix || '') + (preferences.starting_number_for_spot || ''),
    };
    const orderedIntervals = orderStratSectionIntervals(intervals);
    const intervalsForInsert = [...orderedIntervals, {properties: {name: '-- Bottom --', id: 1}}];
    return (
      <Formik
        initialValues={initialIntervalName}
        onSubmit={() => console.log('Submitting form...')}
        innerRef={preFormRef}
        enableReinitialize={false}
        validate={validatePreForm}
        validateOnChange={true}
      >
        {() => (
          <>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={formProps => (
                    SelectInputField({setFieldValue: formProps.form.setFieldValue, ...formProps.field, ...formProps})
                  )}
                  name={'intervalToInsertAfter'}
                  key={'intervalToInsertAfter'}
                  label={'Insert New Interval After:'}
                  choices={intervalsForInsert.map(s => ({label: s.properties.name, value: s.properties.id}))}
                  single={true}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={formProps => (
                    SelectInputField({setFieldValue: formProps.form.setFieldValue, ...formProps.field, ...formProps})
                  )}
                  name={'intervalToCopyId'}
                  key={'intervalToCopyId'}
                  label={'Copy Interval Data From:'}
                  choices={orderedIntervals.map(s => ({label: s.properties.name, value: s.properties.id}))}
                  single={true}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <Field
                  component={TextInputField}
                  name={'intervalName'}
                  label={'Interval Name'}
                  key={'intervalName'}
                />
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </Formik>
    );
  };

  const renderAddIntervalFormFields = () => {
    return (
      <Formik
        innerRef={formRef}
        onSubmit={() => console.log('Submitting form...')}
        validate={values => validateForm({formName: formName, values: values})}
        initialValues={initialFormValues}
        initialStatus={{formName: formName}}
        enableReinitialize={true}
      >
        {formProps => <Form {...{...formProps, formName: formName}}/>}
      </Formik>
    );
  };

  const renderAddIntervalModal = () => {
    return (
      <ModalWrapper
        title={'Add Interval'}
        buttonTitleLeft={'Cancel'}
        buttonTitleRight={'Save'}
        cancel={() => close()}
        closeModal={() => saveInterval(formRef?.current?.values)}
      >
        <FlatList
          ListHeaderComponent={renderAddIntervalNameField()}
          ListFooterComponent={renderAddIntervalFormFields()}
        />
      </ModalWrapper>
    );
  };

  const saveInterval = async () => {
    try {
      await formRef.current.submitForm();
      const intervalData = showErrors(formRef.current);
      if (doUnitsFieldsMatch(intervalData)) {
        let newInterval = createInterval(stratSection.strat_section_id, intervalData);
        if (preFormRef.current?.values?.intervalName) {
          newInterval.properties.name = preFormRef.current.values.intervalName;
        }
        if (intervalToCopy) newInterval = copyRestOfInterval(newInterval);
        const newSpot = await createSpot({type: 'Feature', ...newInterval});
        if (preFormRef.current?.values?.intervalToInsertAfter) {
          const intervalToInsertAfterObj = intervals.find(
            i => i.properties.id === preFormRef.current.values.intervalToInsertAfter);
          console.log('Insert after', preFormRef.current.values.intervalToInsertAfter, intervalToInsertAfterObj);
          moveIntervalToAfter(newSpot, intervalToInsertAfterObj);
        }
        dispatch(setSelectedSpot(newSpot));
        dispatch(setModalValues({}));
        dispatch(setModalVisible({modal: null}));
        if (preferences.starting_number_for_spot) {
          const updatedPreferences = {
            ...preferences,
            starting_number_for_spot: preferences.starting_number_for_spot + 1,
          };
          dispatch(updatedProject({field: 'preferences', value: updatedPreferences}));
        }
      }
    }
    catch (e) {
      console.log('Error saving interval', e);
    }
  };

  const validatePreForm = (values) => {
    console.log('Values before geometry validation:', values);
    let errors = {};
    if (values.intervalToCopyId) {
      const copyInterval = intervals.find(i => i.properties.id === values.intervalToCopyId);
      copyIntervalLithology(copyInterval);
    }
    else setIntervalToCopy(null);
    console.log('Values after geometry validation:', values);
    return errors;
  };

  return renderAddIntervalModal();
};

export default AddIntervalModal;
