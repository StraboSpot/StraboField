import React, {useLayoutEffect, useRef} from 'react';
import {View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useSed from '../sed/useSed';
import {editedSpotProperties} from '../spots/spots.slice';

const formName = ['sed', 'interval'];

const IntervalPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {validateForm} = useForm();
  const {saveSedFeature} = useSed();

  /* Local State */

  const intervalRef = useRef(null);

  /* Derived Variables */

  const character = spot.properties?.sed?.character || undefined;
  const interval = spot.properties?.sed?.interval || {};

  /* Side Effects */

  useLayoutEffect(() => {
    // console.log('ULE IntervalPage []');
    // console.log('Spot:', spot);
    // console.log('Interval:', interval);
    // console.log('Character:', character);
    if (spot.properties?.sed?.interval_type) {
      let editedSedData = JSON.parse(JSON.stringify(spot.properties.sed));
      editedSedData.character = spot.properties?.sed?.interval_type;
      delete spot.properties?.sed?.interval_type;
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));
    }
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const confirmLeavePage = () => {
    if (intervalRef.current && intervalRef.current.dirty) {
      const formCurrent = intervalRef.current;
      alert('Unsaved Changes',
        'Would you like to save your interval before continuing?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: () => saveInterval(formCurrent, false)},
        ],
        {cancelable: false},
      );
    }
  };

  const saveInterval = async (formCurrent) => {
    await saveSedFeature(page.key, spot, formCurrent);
    await formCurrent.resetForm();
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  /* View */

  return (
    <View style={{flex: 1, justifyContent: 'flex-start'}}>
      <PageHeader hideBackButton={!isReadOnly} pageTitle={page.label}/>
      {!isReadOnly && (
        <SaveAndCancelButtons
          cancel={() => dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW))}
          save={() => saveInterval(intervalRef.current)}
        />
      )}
      <Formik
        enableReinitialize={true}
        initialValues={{...interval, character}}
        innerRef={intervalRef}
        onReset={() => console.log('Resetting form...')}
        onSubmit={() => console.log('Submitting form...')}
        validate={values => validateForm({formName: formName, values: values})}
        validateOnChange={false}
      >
        {formProps => <Form {...{...formProps, isReadOnly: isReadOnly, formName: formName}}/>}
      </Formik>
    </View>
  );
};

export default IntervalPage;
