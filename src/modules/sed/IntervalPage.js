import React, {useContext, useLayoutEffect, useRef} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import Form from '../form/Form';
import FormikWrapper from '../form/FormikWrapper';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
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
  const {goToNotebookPage} = useContext(LeavePageContext);

  const {saveSedFeature} = useSed();

  const intervalRef = useRef(null);
  const {isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: intervalRef,
    getMessage: () => 'Your changes to this interval haven\'t been saved.',
    save: () => saveInterval(intervalRef.current),
  });

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
  }, []);

  /* Logic Helpers */

  const cancelFormAndGo = () => goToNotebookPage(PAGE_KEYS.OVERVIEW);

  // Resolves whether the interval was saved. A refusal has already alerted about the field it stopped on.
  const saveInterval = async (formCurrent) => {
    try {
      await saveSedFeature(page.key, spot, formCurrent);
      markSaved();
      await formCurrent.resetForm();
      return true;
    }
    catch (err) {
      console.error('Error saving interval', err);
      return false;
    }
  };

  const saveIntervalAndGo = async () => {
    if (await saveInterval(intervalRef.current)) dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  /* View */

  return (
    <View style={{flex: 1, justifyContent: 'flex-start'}}>
      <PageHeader hideBackButton={!isReadOnly} pageTitle={page.label}/>
      {!isReadOnly && (
        <SaveAndCancelButtons
          cancel={cancelFormAndGo}
          getIsDisabled={isFormInvalid}
          save={saveIntervalAndGo}
        />
      )}
      <FormikWrapper
        enableReinitialize={true}
        formName={formName}
        initialValues={{...interval, character}}
        innerRef={intervalRef}
        onReset={() => console.log('Resetting form...')}
        setIsFormDirty={setIsFormDirty}
        setIsFormInvalid={setIsFormInvalid}
      >
        {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
      </FormikWrapper>
    </View>
  );
};

export default IntervalPage;
