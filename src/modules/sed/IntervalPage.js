import React, {useLayoutEffect, useRef, useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, FormikWrapper} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import useSed from '../sed/useSed';
import {editedSpotProperties} from '../spots/spots.slice';

const formName = ['sed', 'interval'];

const IntervalPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {saveSedFeature} = useSed();

  /* Local State */

  const intervalRef = useRef(null);
  // The values already saved, so leaving straight afterwards does not ask about them again. The form's own
  // dirty flag is not enough on its own: the page can unmount in the same render pass as the save, leaving
  // this ref holding the form as it was before it.
  const savedValuesRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);

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
    if (intervalRef.current?.dirty && !isEqual(intervalRef.current.values, savedValuesRef.current)) {
      const formCurrent = intervalRef.current;
      alert('Unsaved Changes',
        'Would you like to save your interval before continuing?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: () => saveInterval(formCurrent)},
        ],
        {cancelable: false},
      );
    }
  };

  const saveInterval = async (formCurrent) => {
    await saveSedFeature(page.key, spot, formCurrent);
    savedValuesRef.current = {...formCurrent.values};
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
          getIsDisabled={isFormInvalid}
          save={() => saveInterval(intervalRef.current)}
        />
      )}
      <FormikWrapper
        enableReinitialize={true}
        formName={formName}
        initialValues={{...interval, character}}
        innerRef={intervalRef}
        onReset={() => console.log('Resetting form...')}
        setIsFormInvalid={setIsFormInvalid}
      >
        {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
      </FormikWrapper>
    </View>
  );
};

export default IntervalPage;
