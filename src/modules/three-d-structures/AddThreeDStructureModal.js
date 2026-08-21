import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import AddFault from './AddFault';
import AddOther from './AddOther';
import AddTensor from './AddTensor';
import {AddFold, FoldGeometryChoices} from './fold-geometry';
import {THREE_D_STRUCTURE_TYPES} from './threeDStructures.constants';
import {getNewId, isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const groupKey = '_3d_structures';
const types = Object.values(THREE_D_STRUCTURE_TYPES);

const AddThreeDStructureModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getChoices, getRelevantFields, getSurvey, submitAndShowErrors, validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  const [choices, setChoices] = useState({});
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(null);
  const [survey, setSurvey] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddThreeDStructureModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  useEffect(() => {
    console.log('UE AddThreeDStructureModal [modalValues]', modalValues);
    const initialValues = isEmpty(modalValues) ? {id: getNewId(), type: THREE_D_STRUCTURE_TYPES.FOLD} : modalValues;
    formRef.current?.setValues(initialValues);
    setSelectedTypeIndex(types.indexOf(initialValues.type));
    const formName = [groupKey, initialValues.type];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
  }, [modalValues]);

  /* Logic Helpers */

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const on3DStructureTypePress = (i) => {
    if (i !== selectedTypeIndex) {
      setSelectedTypeIndex(i);
      formRef.current?.resetForm();
      const type = types[i];
      formRef.current?.setFieldValue('type', type);
      const formName = [groupKey, type];
      formRef.current?.setStatus({formName: formName});
      setSurvey(getSurvey(formName));
      setChoices(getChoices(formName));
    }
  };

  const save3DStructure = async () => {
    try {
      const {values: edited3DStructureData} = await submitAndShowErrors(formRef.current);
      console.log('Saving 3D Structure data to Spot ...');
      let edited3DStructuresData = spot.properties[groupKey] ? JSON.parse(JSON.stringify(spot.properties[groupKey]))
        : [];
      edited3DStructuresData.push({...edited3DStructureData, id: getNewId()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: groupKey, value: edited3DStructuresData}));
      if (SMALL_SCREEN) closeModal();
    }
    catch (err) {
      console.error('Error submitting form', err);
    }
  };

  /* Render Functions */

  const renderForm = (formProps) => {
    if (formProps && formProps.status && formProps.status.formName) {
      return (
        <>
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={Object.values(THREE_D_STRUCTURE_TYPES).map(v => toTitleCase(v))}
            containerStyle={{height: 40, borderRadius: 10}}
            onPress={on3DStructureTypePress}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedTypeIndex}
            textStyle={{color: PRIMARY_TEXT_COLOR}}
          />
          {types[selectedTypeIndex] === THREE_D_STRUCTURE_TYPES.FOLD && (
            <AddFold
              choices={choices}
              formName={formProps.status.formName}
              formProps={formProps}
              setChoicesViewKey={setChoicesViewKey}
              survey={survey}
            />
          )}
          {types[selectedTypeIndex] === THREE_D_STRUCTURE_TYPES.FAULT && (
            <AddFault
              choices={choices}
              formName={formProps.status.formName}
              formProps={formProps}
              setChoicesViewKey={setChoicesViewKey}
              survey={survey}
            />
          )}
          {types[selectedTypeIndex] === THREE_D_STRUCTURE_TYPES.TENSOR && (
            <AddTensor
              formName={formProps.status.formName}
              formProps={formProps}
            />
          )}
          {types[selectedTypeIndex] === THREE_D_STRUCTURE_TYPES.OTHER && (
            <AddOther
              formName={formProps.status.formName}
              formProps={formProps}
              setChoicesViewKey={setChoicesViewKey}
              survey={survey}
            />
          )}
        </>
      );
    }
  };

  const renderNotebookThreeDStructureModalContent = () => {
    const formName = [groupKey, types[selectedTypeIndex]];
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : closeModal()}
        headerTitle={'Add 3D Structure'}
        onActionPressed={save3DStructure}
        showActionButton={!choicesViewKey}
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
                {formProps => (
                  <View style={{flex: 1}}>
                    {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                  </View>
                )}
              </Formik>
            </View>
          }
          bounces={false}
        />
      </ModalWrapper>
    );
  };

  const renderSubform = (formProps) => {
    if (choicesViewKey === 'fold_geometry') {
      return <FoldGeometryChoices choices={choices} formProps={formProps} survey={survey}/>;
    }
    else {
      let relevantFields = getRelevantFields(survey, choicesViewKey);
      if (formProps.values.type === 'other' && choicesViewKey === 'feature_type') {
        relevantFields = [survey.find(f => f.name === choicesViewKey)];
      }
      return (
        <Form {...formProps} formName={[groupKey, formRef.current?.values?.type]} surveyFragment={relevantFields}/>
      );
    }
  };

  /* View */

  return renderNotebookThreeDStructureModalContent();
};

export default AddThreeDStructureModal;
