import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {FABRIC_TYPES} from './fabric.constants';
import FaultRockFabric from './FaultRockFabric';
import IgneousRockFabric from './IgneousRockFabric';
import MetamRockFabric from './MetamRockFabric';
import {getNewId, isEmpty} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddFabricModal = ({onPress}) => {
  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const spot = useSelector(state => state.spot.selectedSpot);

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(null);
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [survey, setSurvey] = useState({});
  const [choices, setChoices] = useState({});

  const {getChoices, getRelevantFields, getSurvey, showErrors, validateForm} = useForm();

  const formRef = useRef(null);

  const types = Object.keys(FABRIC_TYPES);
  const groupKey = 'fabrics';

  useEffect(() => {
    console.log('UE AddFabricModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  useEffect(() => {
    console.log('UE AddFabricModal [modalValues]', modalValues);
    const initialValues = isEmpty(modalValues) ? {id: getNewId(), type: 'fault_rock'} : modalValues;
    formRef.current?.setValues(initialValues);
    setSelectedTypeIndex(types.indexOf(initialValues.type));
    const formName = [groupKey, initialValues.type];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
  }, [modalValues]);

  const onFabricTypePress = (i) => {
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
          <FaultRockFabric
            choices={choices}
            formName={formProps.status.formName}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {types[selectedTypeIndex] === 'igneous_rock' && (
          <IgneousRockFabric
            choices={choices}
            formName={formProps.status.formName}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {types[selectedTypeIndex] === 'metamorphic_rock' && (
          <MetamRockFabric
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
    const formName = [groupKey, types[selectedTypeIndex]];
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : dispatch(setModalVisible({modal: null}))}
        onPress={onPress}
      >
        <>
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
        </>
        {!choicesViewKey && <ActionButton onPress={saveFabric} title={'Save Fabric'}/>}
      </ModalWrapper>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form {...{formName: [groupKey, formRef.current?.values?.type], surveyFragment: relevantFields, ...formProps}}/>
    );
  };

  const saveFabric = async () => {
    try {
      await formRef.current.submitForm();
      const editedFabricData = showErrors(formRef.current);
      console.log('Saving fabric data to Spot ...');
      let editedFabricsData = spot.properties.fabrics ? JSON.parse(JSON.stringify(spot.properties.fabrics)) : [];
      editedFabricsData.push({...editedFabricData, id: getNewId()});
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: groupKey, value: editedFabricsData}));
    }
    catch (err) {
      console.log('Error submitting form', err);
    }
  };

  return renderNotebookFabricModalContent();
};

export default AddFabricModal;
