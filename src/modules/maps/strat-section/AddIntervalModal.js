import React, {useEffect, useRef, useState} from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import useStratSection from './useStratSection';
import useStratSectionCalculations from './useStratSectionCalculations';
import commonStyles from '../../../shared/common.styles';
import {deepObjectExtend} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {Form, FormikWrapper, SelectInputField, TextInputField, useForm} from '../../form';
import {setModalValues, setModalVisible} from '../../home/home.slice';
import {updatedProject} from '../../project/projects.slice';
import {useSpots} from '../../spots';
import {setSelectedSpot} from '../../spots/spots.slice';

const formName = ['sed', 'add_interval'];

const AddIntervalModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const stratSection = useSelector(state => state.map.stratSection);

  const {getLabel, getSurvey, submitAndShowErrors} = useForm();
  const {createSpot, getActiveIntervalSpotsOnStratSection} = useSpots();
  const {createInterval, isNegativeColumn, orderStratSectionIntervals} = useStratSection();
  const {moveIntervalToAfter} = useStratSectionCalculations();

  /* Local State */

  const formRef = useRef(null);
  const preFormRef = useRef(null);

  const [intervalToCopy, setIntervalToCopy] = useState(null);
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Derived Variables */
  const intervals = getActiveIntervalSpotsOnStratSection(stratSection.strat_section_id);
  const isCore = isNegativeColumn();

  /* Side Effects */

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
    formRef.current.setValues(initialValues);
  }, []);

  /* Logic Helpers */

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
      formRef.current.setValues(copiedData);
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

  // Extract the data from the Spot object in the format needed for the Add Interval modals
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

  const saveInterval = async () => {
    try {
      const {values: intervalData} = await submitAndShowErrors(formRef.current);
      if (doUnitsFieldsMatch(intervalData)) {
        let newInterval = createInterval(stratSection.strat_section_id, intervalData);
        if (preFormRef.current?.values?.intervalName) {
          newInterval.properties.name = preFormRef.current.values.intervalName;
        }
        if (intervalToCopy) newInterval = copyRestOfInterval(newInterval);
        const newSpot = await createSpot({type: 'Feature', ...newInterval});
        const insertAfterValue = preFormRef.current?.values?.intervalToInsertAfter;
        // Core + Top: place at y=0 (surface), shifting existing intervals deeper
        if (insertAfterValue === 'top' && isCore) moveIntervalToAfter(newSpot, null);
        // Non-core + Bottom: place at y=0 (base), shifting existing intervals up
        else if (insertAfterValue === 'bottom' && !isCore) moveIntervalToAfter(newSpot, null);
        // Specific interval selected: insert after that interval
        else if (insertAfterValue && insertAfterValue !== 'top' && insertAfterValue !== 'bottom') {
          const intervalToInsertAfterObj = intervals.find(i => i.properties.id === insertAfterValue);
          console.log('Insert after', insertAfterValue, intervalToInsertAfterObj);
          moveIntervalToAfter(newSpot, intervalToInsertAfterObj);
        }
        // else: 'top' for non-core or 'bottom' for core = natural end-of-stack placement, no repositioning needed
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
    catch (err) {
      console.error('Error saving interval', err);
    }
  };

  /* Render Functions */

  const renderAddIntervalFormFields = () => {
    return (
      <FormikWrapper
        formName={formName}
        initialValues={{}}
        innerRef={formRef}
        setIsFormInvalid={setIsFormInvalid}
      >
        {formProps => <Form {...formProps} formName={formName}/>}
      </FormikWrapper>
    );
  };

  const renderAddIntervalModal = () => {
    return (
      <ModalWrapper
        closeModal={close}
        disabled={isFormInvalid}
        headerTitle={'Add Interval'}
        onActionPressed={() => saveInterval(formRef?.current?.values)}
        showActionButton
        showCancelButton={false}
        showCloseButton
      >
        <FlatList
          ListFooterComponent={renderAddIntervalFormFields()}
          ListHeaderComponent={renderAddIntervalNameField()}
        />
      </ModalWrapper>
    );
  };

  const renderAddIntervalNameField = () => {
    const initialIntervalName = {
      intervalName: (preferences.spot_prefix || '') + (preferences.starting_number_for_spot || ''),
      intervalToInsertAfter: isCore ? 'bottom' : 'top',
    };
    const orderedIntervals = orderStratSectionIntervals(intervals);
    const intervalsForInsert = [
      {properties: {name: '-- Top --', id: 'top'}},
      ...orderedIntervals,
      {properties: {name: '-- Bottom --', id: 'bottom'}},
    ];
    return (
      <FormikWrapper initialValues={initialIntervalName} innerRef={preFormRef}>
        <>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <SelectInputField
                choices={intervalsForInsert.map(s => ({label: s.properties.name, value: s.properties.id}))}
                isSingleSelect={true}
                label={isCore ? 'Insert New Interval Below:' : 'Insert New Interval Above:'}
                name={'intervalToInsertAfter'}
              />
            </ListItem.Content>
          </ListItem>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <SelectInputField
                choices={orderedIntervals.map(s => ({label: s.properties.name, value: s.properties.id}))}
                isSingleSelect={true}
                label={'Copy Interval Data From:'}
                name={'intervalToCopyId'}
                onValueChanged={(name, value) => copyIntervalLithology(
                  intervals.find(i => i.properties.id === value))}
              />
            </ListItem.Content>
          </ListItem>
          <ListItem containerStyle={commonStyles.listItemFormField}>
            <ListItem.Content>
              <TextInputField
                label={'Interval Name'}
                name={'intervalName'}
              />
            </ListItem.Content>
          </ListItem>
        </>
      </FormikWrapper>
    );
  };

  /* View */

  return renderAddIntervalModal();
};

export default AddIntervalModal;
