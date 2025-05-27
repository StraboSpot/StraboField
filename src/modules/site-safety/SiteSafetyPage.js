import React, {useRef} from 'react';
import {FlatList, View} from 'react-native';

import * as turf from '@turf/turf';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import SaveAndCancelButtons from '../../shared/ui/SaveAndCancelButtons';
import SectionDivider from '../../shared/ui/SectionDivider';
import {Form, useForm} from '../form';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PAGE_KEYS, SECONDARY_PAGES} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties, setSelectedSpotNotesTimestamp} from '../spots/spots.slice';

const SiteSafetyPage = () => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {showErrors, validateForm} = useForm();

  const formRef = useRef(null);
  const page = SECONDARY_PAGES.find(p => p.key === PAGE_KEYS.SITE_SAFETY);
  const formName = ['general', 'site_safety'];

  let initialValues = spot.properties?.site_safety || {};
  const coord = spot?.geometry?.type === 'Point' ? turf.getCoord(spot) : undefined;
  if (isEmpty(initialValues) && !isEmpty(coord)) {
    initialValues = {
      latitude: coord[1].toString(),
      longitude: coord[0].toString(),
    };
  }

  const cancelFormAndGo = () => {
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  const saveFormAndGo = async () => {
    try {
      await saveForm(formRef.current);
      dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  const saveForm = async (currentForm) => {
    try {
      await currentForm.submitForm();
      const editedSiteSafetyFormData = showErrors(currentForm);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(setSelectedSpotNotesTimestamp());
      dispatch(editedSpotProperties({field: 'site_safety', value: editedSiteSafetyFormData}));
      await currentForm.resetForm();
    }
    catch (err) {
      console.log('Error submitting form', err);
      return Promise.reject();
    }
  };

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCancelButtons
          cancel={() => cancelFormAndGo()}
          save={() => saveFormAndGo()}
        />
      </View>
    );
  };

  const renderSiteSafetyForm = () => {
    return (
      <Formik
        innerRef={formRef}
        onSubmit={values => console.log('Submitting form...', values)}
        onReset={() => console.log('Resetting form...')}
        validate={values => validateForm({formName: formName, values: values})}
        initialValues={initialValues}
        enableReinitialize={true}
        initialStatus={{formName: formName}}
      >
        {formProps => <Form {...{...formProps, formName: formName}}/>}
      </Formik>
    );
  };

  return (
    <>
      {renderCancelSaveButtons()}
      <FlatList
        ListHeaderComponent={
          <>
            <SectionDivider dividerText={page.label}/>
            {renderSiteSafetyForm()}
          </>
        }
      />
    </>
  );
};

export default SiteSafetyPage;
