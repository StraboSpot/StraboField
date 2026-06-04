import React, {useLayoutEffect, useRef, useState} from 'react';
import {Platform, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import QAQCForm from './QAQCForm';
import {getNewId} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {setLoadingStatus} from '../home/home.slice';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const QAQC = ({isReadOnly}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const existingQAQC = useSelector(state => state.spot.selectedSpot?.properties?.qaqc);
  const initialQAQC = existingQAQC?.notes || undefined;
  const spot = useSelector(state => state.spot.selectedSpot);

  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  const [initialQAQCValues] = useState({qaqc: initialQAQC});

  /* Side Effects */

  useLayoutEffect(() => {
    return () => confirmLeavePage();
  }, []);

  /* Logic Helpers */

  const cancelFormAndGo = () => {
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  const confirmLeavePage = () => {
    if (formRef.current && formRef.current.dirty) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [{
          text: 'No',
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveFormAndGo(formCurrent),
        }],
        {cancelable: false},
      );
    }
  };

  const saveForm = async (currentForm) => {
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      await currentForm.submitForm();
      const spotId = spot.properties.id;
      const qaqcData = {
        id: existingQAQC?.id || getNewId(),
        notes: currentForm.values.qaqc,
        timestamp: Date.now(),
      };
      dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
      dispatch(editedSpotProperties({field: 'qaqc', value: qaqcData, spotId: spotId}));
      await currentForm.resetForm();
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS !== 'web') toast.show('QA/QC Saved', {type: 'success'});
    }
    catch (err) {
      console.log('Error submitting form', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const saveFormAndGo = async (currentForm) => {
    try {
      await saveForm(currentForm);
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  /* Render Functions */

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <PageHeader hideBackButton={!isReadOnly} pageTitle={'QA/QC'}/>
        {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} save={() => saveFormAndGo(formRef.current)}/>}
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {renderCancelSaveButtons()}
      <FlatListItemSeparator/>
      <QAQCForm
        formRef={formRef}
        initialQAQCValues={initialQAQCValues}
        isReadOnly={isReadOnly}
      />
    </View>
  );
};

export default QAQC;
