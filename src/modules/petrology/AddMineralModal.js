import React, {useEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import MineralsByRockClass from './MineralsByRockClass';
import MineralsGlossary from './MineralsGlossary';
import {ADD_ROCK_KEYS} from './petrology.constants';
import usePetrology from './usePetrology';
import {getNewId, isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import LittleSpacer from '../../shared/ui/LittleSpacer';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {ChoiceButtons, Form, FormikWrapper, MainButtons, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import TemplatesNotebook from '../templates/TemplatesNotebook';

const {firstKeys, igOrMetKey, igButtonsKeys, metButtonsKeys, lastKeys} = ADD_ROCK_KEYS.mineral;

const AddMineralModal = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const {getChoices, getRelevantFields, getSurvey} = useForm();
  const {onMineralChange, savePetFeature, savePetFeatureValuesFromTemplates} = usePetrology();

  /* Local State */

  const formRef = useRef(null);

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [initialValues, setInitialValues] = useState({id: getNewId()});
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(null);

  /* Derived Variables */

  // Relevant fields for quick-entry modal
  const petKey = PAGE_KEYS.MINERALS;
  const areMultipleTemplates = templates[petKey] && templates[petKey].isInUse && templates[petKey].active
    && templates[petKey].active.length > 1;
  const formName = ['pet', petKey];
  const choices = getChoices(formName);
  const survey = getSurvey(formName);
  const firstKeysFields = firstKeys.map(k => survey.find(f => f.name === k));
  const lastKeysFields = lastKeys.map(k => survey.find(f => f.name === k));

  /* Side Effects */

  useEffect(() => {
    console.log('UE AddMineralModal [templates]', templates);
    if (templates[petKey] && templates[petKey].isInUse && templates[petKey].active
      && templates[petKey].active[0] && templates[petKey].active[0].values) {
      setInitialValues({...templates[petKey].active[0].values, id: getNewId()});
    }
    return () => dispatch(setModalValues({}));
  }, [templates]);

  /* Event Handlers */

  const onCloseModalPressed = () => {
    if (choicesViewKey) setChoicesViewKey(null);
    else if (isShowTemplates) setIsShowTemplates(false);
    else if (!isEmpty(selectedTypeIndex)) setSelectedTypeIndex(null);
    else dispatch(setModalVisible({modal: null}));
  };

  const onIgOrMetSelected = (choiceName) => {
    if (formRef.current?.values[igOrMetKey] && formRef.current?.values[igOrMetKey] === choiceName) {
      formRef.current?.setFieldValue(igOrMetKey, undefined);
    }
    else formRef.current?.setFieldValue(igOrMetKey, choiceName);

    // Remove relevant values
    const relevantIgMetFields = getRelevantFields(survey, igOrMetKey);
    relevantIgMetFields.map((f) => {
      if (f.name !== igOrMetKey && formRef.current?.values[f.name]) formRef.current?.setFieldValue(f.name, undefined);
    });
  };

  const onViewTypePress = (i) => {
    // The form unmounts while a mineral lookup is showing, so hold on to what has been entered
    if (formRef.current) setInitialValues(formRef.current.values);
    if (selectedTypeIndex === i) setSelectedTypeIndex(null);
    else setSelectedTypeIndex(i);
  };

  /* Logic Helpers */

  const addMineral = (mineralInfo) => {
    setInitialValues(currentValues => ({
      ...currentValues,
      id: getNewId(),
      mineral_abbrev: mineralInfo.Abbreviation,
      full_mineral_name: mineralInfo.Label,
    }));
    setSelectedTypeIndex(null);
  };

  // Await the save so a failed one stops here: it alerts and throws when the form has errors, and rolling the id
  // over or closing the modal would then lose what was entered.
  const saveMineral = async () => {
    try {
      if (areMultipleTemplates) savePetFeatureValuesFromTemplates(petKey, spot, templates[petKey].active);
      else await savePetFeature(petKey, spot, formRef.current);
      formRef.current?.setFieldValue('id', getNewId());
      if (SMALL_SCREEN) onCloseModalPressed();
    }
    catch (err) {
      console.error('Error saving mineral', err);
    }
  };

  /* Render Functions */

  const renderAddMineral = () => {
    return (
      <>
        {!choicesViewKey && !areMultipleTemplates && (
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={['Look up by Rock Class', 'Look up in Glossary']}
            containerStyle={{height: 50, borderRadius: 10}}
            onPress={onViewTypePress}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedTypeIndex}
            textStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE, textAlign: 'center'}}
          />
        )}
        {isEmpty(selectedTypeIndex) && renderForms()}
        {selectedTypeIndex === 0 && <MineralsByRockClass addMineral={addMineral}/>}
        {selectedTypeIndex === 1 && <MineralsGlossary addMineral={addMineral}/>}
      </>
    );
  };

  const renderForm = (formProps) => {
    return (
      <>
        <Form
          {...formProps}
          formName={formName}
          onMyChange={(name, value) => onMineralChange(formProps, name, value)}
          surveyFragment={firstKeysFields}
        />
        <LittleSpacer/>
        <ChoiceButtons
          choiceFieldKey={igOrMetKey}
          choices={choices}
          formProps={formProps}
          onPress={onIgOrMetSelected}
          size={'small'}
          survey={survey}
        />
        {!isEmpty(formProps.values[igOrMetKey]) && formProps.values[igOrMetKey] === 'ig_min' && (
          <MainButtons
            formName={formName}
            formProps={formProps}
            mainKeys={igButtonsKeys}
            setChoicesViewKey={setChoicesViewKey}
          />
        )}
        {!isEmpty(formProps.values[igOrMetKey]) && formProps.values[igOrMetKey] === 'met_min' && (
          <MainButtons
            formName={formName}
            formProps={formProps}
            mainKeys={metButtonsKeys}
            setChoicesViewKey={setChoicesViewKey}
          />
        )}
        <LittleSpacer/>
        <Form {...formProps} formName={formName} surveyFragment={lastKeysFields}/>
      </>
    );
  };

  const renderForms = () => {
    return (
      <>
        {!areMultipleTemplates && (
          <FlatList
            ListHeaderComponent={
              <View style={{flex: 1}}>
                <FormikWrapper
                  enableReinitialize={true}
                  formName={formName}
                  initialValues={initialValues}
                  innerRef={formRef}
                  setIsFormInvalid={setIsFormInvalid}
                >
                  {formProps => (
                    <View style={{flex: 1}}>
                      {choicesViewKey ? renderSubform(formProps) : renderForm(formProps)}
                    </View>
                  )}
                </FormikWrapper>
              </View>
            }
            bounces={false}
          />
        )}
      </>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return <Form {...formProps} formName={formName} surveyFragment={relevantFields}/>;
  };

  /* View */

  return (
    <ModalWrapper
      buttonTitleRight={choicesViewKey || !isEmpty(selectedTypeIndex) ? 'Done' : isShowTemplates ? '' : null}
      closeModal={onCloseModalPressed}
      disabled={isFormInvalid}
      headerTitle={isEmpty(selectedTypeIndex) ? 'Add Mineral Data' : 'Select Mineral'}
      onActionPressed={saveMineral}
      showActionButton={!isShowTemplates && isEmpty(selectedTypeIndex) && !choicesViewKey}
      showCancelButton={false}
      showCloseButton={!areMultipleTemplates}
    >
      {!choicesViewKey && isEmpty(selectedTypeIndex) && (
        <TemplatesNotebook
          isShowTemplates={isShowTemplates}
          setIsShowTemplates={bool => setIsShowTemplates(bool)}
        />
      )}
      {!isShowTemplates && renderAddMineral()}
    </ModalWrapper>
  );
};

export default AddMineralModal;
