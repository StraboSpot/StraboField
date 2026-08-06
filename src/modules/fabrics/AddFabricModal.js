import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {DEFAULT_FABRIC_TYPE, FABRICS_GROUP_KEY, FABRIC_TYPES} from './fabric.constants';
import IgneousFabric from './IgneousFabric';
import MetamorphicFabric from './MetamorphicFabric';
import StructuralFabric from './StructuralFabric';
import {getNewId, isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddFabricModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getChoices, getRelevantFields, getSurvey, showErrors, validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  const [choices, setChoices] = useState({});
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(null);
  const [survey, setSurvey] = useState({});

  /* Derived Variables */

  const types = Object.keys(FABRIC_TYPES);

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddFabricModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  useEffect(() => {
    console.log('UE AddFabricModal [modalValues]', modalValues);
    const initialValues = isEmpty(modalValues) ? {id: getNewId(), type: DEFAULT_FABRIC_TYPE} : modalValues;
    formRef.current?.setValues(initialValues);
    setSelectedTypeIndex(types.indexOf(initialValues.type));
    const formName = [FABRICS_GROUP_KEY, initialValues.type];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
  }, [modalValues]);

  /* Event Handlers */

  const onFabricTypePress = (i) => {
    if (i !== selectedTypeIndex) {
      setSelectedTypeIndex(i);
      formRef.current?.resetForm();
      const type = types[i];
      formRef.current?.setFieldValue('type', type);
      const formName = [FABRICS_GROUP_KEY, type];
      formRef.current?.setStatus({formName: formName});
      setSurvey(getSurvey(formName));
      setChoices(getChoices(formName));
    }
  };

  /* Logic Helpers */

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const saveFabric = async () => {
    try {
      await formRef.current.submitForm();
      const editedFabricData = showErrors(formRef.current);
      console.log('Saving fabric data to Spot ...');
      let editedFabricsData = spot.properties.fabrics ? JSON.parse(JSON.stringify(spot.properties.fabrics)) : [];
      editedFabricsData.push({...editedFabricData, id: getNewId()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: FABRICS_GROUP_KEY, value: editedFabricsData}));
      if (SMALL_SCREEN) closeModal();
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  /* Render Functions */

  const renderForm = (formProps) => {
    return (
      <>
        <ButtonGroup
          buttonStyle={{padding: 5}}
          buttons={Object.values(FABRIC_TYPES)}
          containerStyle={{height: 40, borderRadius: 10}}
          onPress={onFabricTypePress}
          selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
          selectedIndex={selectedTypeIndex}
          textStyle={{color: PRIMARY_TEXT_COLOR}}
        />
        {types[selectedTypeIndex] === 'fault_rock' && (
          <StructuralFabric
            choices={choices}
            formName={formProps.status.formName}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {types[selectedTypeIndex] === 'igneous_rock' && (
          <IgneousFabric
            choices={choices}
            formName={formProps.status.formName}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {types[selectedTypeIndex] === 'metamorphic_rock' && (
          <MetamorphicFabric
            choices={choices}
            formName={formProps.status.formName}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
      </>
    );
  };

  const renderNotebookFabricModalContent = () => {
    const formName = [FABRICS_GROUP_KEY, types[selectedTypeIndex]];
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : closeModal()}
        onActionPressed={saveFabric}
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
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form {...{formName: [FABRICS_GROUP_KEY, formRef.current?.values?.type], surveyFragment: relevantFields, ...formProps}}/>
    );
  };

  /* View */

  return renderNotebookFabricModalContent();
};

export default AddFabricModal;
