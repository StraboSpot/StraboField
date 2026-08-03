import React, {useEffect, useRef} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const pageKey = PAGE_KEYS.OUTCROP_SUMMARIES;
const formName = ['general', pageKey];

const AddOutcropSummaryModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {showErrors, validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddOutcropSummaryModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  /* Logic Helpers */

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const saveOutcropSummary = async () => {
    try {
      await formRef.current.submitForm();
      const editedOutcropSummaryData = showErrors(formRef.current);
      console.log('Saving outcrop summary data to Spot ...');
      const editedOutcropSummariesData = spot.properties[pageKey]
        ? JSON.parse(JSON.stringify(spot.properties[pageKey]))
        : [];
      editedOutcropSummariesData.push({...editedOutcropSummaryData, id: getNewUUID()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: pageKey, value: editedOutcropSummariesData}));
      if (SMALL_SCREEN) closeModal();
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  /* Render Functions */

  const renderNotebookOutcropSummaryModal = () => {
    return (
      <ModalWrapper
        closeModal={closeModal}
        onActionPressed={saveOutcropSummary}
        showCancelButton={false}
        showCloseButton
      >
        <FlatList
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                initialValues={{}}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
                validate={values => validateForm({formName: formName, values: values})}
                validateOnChange={false}
              >
                {formProps => <Form {...{...formProps, formName: formName}}/>}
              </Formik>
            </View>
          }
          bounces={false}
        />
      </ModalWrapper>
    );
  };

  /* View */

  return renderNotebookOutcropSummaryModal();
};

export default AddOutcropSummaryModal;
