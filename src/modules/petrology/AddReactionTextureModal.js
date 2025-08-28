import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import usePetrology from './usePetrology';
import {getNewId, isEmpty} from '../../shared/Helpers';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import OverlayWrapper from '../../shared/ui/modal/OverlayWrapper';
import SaveButton from '../../shared/ui/SaveButton';
import {ChoiceButtons, Form, formStyles, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';

const AddReactionTextureModal = ({onPress}) => {
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

  const renderAddReactionTextureModalContent = () => {
    return (
      <OverlayWrapper
        closeModal={() => choicesViewKey ? setChoicesViewKey(null) : dispatch(setModalVisible({modal: null}))}
        buttonTitleRight={choicesViewKey && 'Done'}
        onPress={onPress}
      >
        <FlatList
          bounces={false}
          ListHeaderComponent={
            <View style={{flex: 1}}>
              <Formik
                innerRef={formRef}
                initialValues={{id: getNewId()}}
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
        />
        {!choicesViewKey && <SaveButton title={'Save Reaction Texture'} onPress={saveReactionTexture}/>}
      </OverlayWrapper>
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
          survey={survey}
          choices={choices}
          formProps={formProps}
          onPress={choice => onMultiChoiceSelected(basedOnKey, choice)}
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

  const saveReactionTexture = () => {
    savePetFeature(petKey, spot, formRef.current);
    formRef.current?.setFieldValue('id', getNewId());
  };

  return renderAddReactionTextureModalContent();
};

export default AddReactionTextureModal;
