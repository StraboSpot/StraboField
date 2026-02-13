import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import usePetrology from './usePetrology';
import {getNewId, isEmpty} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {ChoiceButtons, Form, formStyles, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';

const AddReactionTextureModal = () => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const [choicesViewKey, setChoicesViewKey] = useState(null);

  const formRef = useRef(null);

  const {getChoices, getSurvey, getRelevantFields} = useForm();
  const {savePetFeature} = usePetrology();

  // Relevant keys for quick-entry modal
  const firstKeys = ['reactions'];
  const basedOnKey = 'based_on';
  const baseOnOtherKey = 'other_based_on';
  const lastKeys = ['notes'];

  // Relevant fields for quick-entry modal
  const petKey = PAGE_KEYS.REACTIONS;
  const formName = ['pet', petKey];
  const survey = getSurvey(formName);
  const choices = getChoices(formName);
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const basedOnOtherField = survey.find(f => f.name === baseOnOtherKey);
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  useEffect(() => {
    console.log('UE AddReactionTextureModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const onMultiChoiceSelected = (fieldKey, choiceName) => {
    const fieldValues = formRef.current?.values[fieldKey] || [];
    if (fieldValues.includes(choiceName)) {
      const fieldValuesFiltered = fieldValues.filter(n => n !== choiceName);
      formRef.current?.setFieldValue(fieldKey, fieldValuesFiltered);
    }
    else formRef.current?.setFieldValue(fieldKey, [...fieldValues, choiceName]);

    // Remove relevant values
    const relevantFields = getRelevantFields(survey, fieldKey);
    relevantFields.map((f) => {
      if (f.name !== fieldKey && formRef.current?.values[f.name]) formRef.current?.setFieldValue(f.name, undefined);
    });
  };

  const saveReactionTexture = () => {
    savePetFeature(petKey, spot, formRef.current);
    formRef.current?.setFieldValue('id', getNewId());
    if (SMALL_SCREEN) closeModal();
  };

  const renderAddReactionTextureModalContent = () => {
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey && 'Done'}
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : closeModal()}
        showActionButton={false}
        showCancelButton={false}
        showCloseButton
      >
        <FlatList
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                initialValues={{id: getNewId()}}
                innerRef={formRef}
                onSubmit={values => console.log('Submitting form...', values)}
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
        {!choicesViewKey && <ActionButton onPress={saveReactionTexture}/>}
      </ModalWrapper>
    );
  };

  const renderForm = (formProps) => {
    return (
      <>
        <Form {...{formName: formName, surveyFragment: firstKeysFields, ...formProps}}/>
        <Text style={{paddingLeft: 10, paddingRight: 10, textAlign: 'center'}}>{
          survey.find(f => f.name === 'reactions').hint}
        </Text>
        <LittleSpacer/>
        <View style={{...formStyles.fieldLabelContainer, paddingLeft: 10}}>
          <Text style={formStyles.fieldLabel}>{survey.find(f => f.name === basedOnKey).label}</Text>
        </View>
        <ChoiceButtons
          choiceFieldKey={basedOnKey}
          choices={choices}
          formProps={formProps}
          onPress={choice => onMultiChoiceSelected(basedOnKey, choice)}
          survey={survey}
        />
        {!isEmpty(formRef.current?.values[basedOnKey]) && formRef.current?.values[basedOnKey].includes('other') && (
          <>
            <LittleSpacer/>
            <Form {...{formName: formName, surveyFragment: [basedOnOtherField], ...formProps}}/>
          </>
        )}
        <LittleSpacer/>
        <Form {...{formName: formName, surveyFragment: lastKeysFields, ...formProps}}/>
      </>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return <Form {...{formName: formName, surveyFragment: relevantFields, ...formProps}}/>;
  };

  return renderAddReactionTextureModalContent();
};

export default AddReactionTextureModal;
