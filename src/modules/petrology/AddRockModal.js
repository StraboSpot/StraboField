import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {ButtonGroup} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import AddRockAlterationOreModal from './AddRockAlterationOreModal';
import AddRockFaultModal from './AddRockFaultModal';
import AddRockIgneousModal from './AddRockIgneousModal';
import AddRockMetamorphicModal from './AddRockMetamorphicModal';
import AddRockSedimentaryModal from './AddRockSedimentaryModal';
import {IGNEOUS_ROCK_CLASSES} from './petrology.constants';
import usePetrology from './usePetrology';
import {getNewId, isEmpty, toTitleCase} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR, SMALL_SCREEN, SMALL_TEXT_SIZE} from '../../shared/styles.constants';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, FormikWrapper, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import useSed from '../sed/useSed';
import TemplatesNotebook from '../templates/TemplatesNotebook';

const AddRockModal = ({modalKey}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const {getChoices, getRelevantFields, getSurvey} = useForm();
  const {savePetFeature, savePetFeatureValuesFromTemplates} = usePetrology();
  const {saveSedFeature, saveSedFeatureValuesFromTemplates} = useSed();

  /* Local State */

  const formRef = useRef(null);

  const [choices, setChoices] = useState({});
  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [initialValues, setInitialValues] = useState({id: getNewId()});
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [rockKey, setRockKey] = useState(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [survey, setSurvey] = useState({});

  /* Derived Variables */

  const areMultipleTemplates = templates[rockKey] && templates[rockKey].isInUse && templates[rockKey].active
    && templates[rockKey].active.length > 1;
  const groupKey = modalKey === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? 'sed' : 'pet';
  const pageKey = modalKey === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? PAGE_KEYS.LITHOLOGIES : modalKey;

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE AddRockModal [modalValues, pageKey, templates]', modalValues, pageKey, templates);
    const rockKeyUpdated = pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS
      ? modalValues.igneous_rock_class || IGNEOUS_ROCK_CLASSES.PLUTONIC
      : pageKey;
    if (Object.values(IGNEOUS_ROCK_CLASSES).includes(rockKeyUpdated)) {
      setSelectedTypeIndex(Object.values(IGNEOUS_ROCK_CLASSES).indexOf(rockKeyUpdated));
    }
    setRockKey(rockKeyUpdated);
    if (templates[rockKeyUpdated] && templates[rockKeyUpdated].isInUse
      && templates[rockKeyUpdated].active && templates[rockKeyUpdated].active[0]
      && templates[rockKeyUpdated].active[0].values) {
      setInitialValues({...templates[rockKeyUpdated].active[0].values, id: getNewId()});
    }
    else {
      const initialValuesTemp = !isEmpty(modalValues) ? modalValues
        : pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS ? {id: getNewId(), igneous_rock_class: rockKeyUpdated}
          : {id: getNewId()};
      setInitialValues(initialValuesTemp);
    }
    const formName = [groupKey, rockKeyUpdated];
    formRef.current?.setStatus({formName: formName});
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
    setChoicesViewKey(null);
  }, [modalValues, pageKey, templates]);

  useEffect(() => {
    console.log('UE AddRockModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  /* Event Handlers */

  const onCloseModalPressed = () => {
    if (choicesViewKey) setChoicesViewKey(null);
    else if (isShowTemplates) setIsShowTemplates(false);
    else dispatch(setModalVisible({modal: null}));
  };

  const onIgneousRockTypePress = (i) => {
    if (i !== selectedTypeIndex) {
      setSelectedTypeIndex(i);
      const types = Object.values(IGNEOUS_ROCK_CLASSES);
      const type = types[i];
      dispatch(setModalValues({id: getNewId(), igneous_rock_class: type}));
      const formNameSwitched = ['pet', type];
      formRef.current?.setStatus({formName: formNameSwitched});
      setSurvey(getSurvey(formNameSwitched));
      setChoices(getChoices(formNameSwitched));
    }
  };

  /* Logic Helpers */

  // Saving alerts and throws when the form has errors, and a sedimentary rock is checked against its interval on
  // top of that, so stop there rather than rolling the id over and closing on a save that did not happen
  const saveRock = async () => {
    try {
      if (areMultipleTemplates) {
        if (groupKey === 'pet') savePetFeatureValuesFromTemplates(pageKey, spot, templates[rockKey].active);
        else if (groupKey === 'sed') saveSedFeatureValuesFromTemplates(pageKey, spot, templates[rockKey].active);
      }
      else {
        if (groupKey === 'pet') await savePetFeature(pageKey, spot, formRef.current);
        else if (groupKey === 'sed') await saveSedFeature(pageKey, spot, formRef.current);
        dispatch(setModalValues({...formRef.current.values, id: getNewId()}));
      }
      if (SMALL_SCREEN) onCloseModalPressed();
    }
    catch (err) {
      console.error('Error saving rock', err);
    }
  };

  /* Render Functions */

  const renderAddRock = () => {
    return (
      <>
        {!areMultipleTemplates && (
          <FlatList
            ListHeaderComponent={
              <View style={{flex: 1}}>
                <FormikWrapper
                  enableReinitialize={true}
                  formName={[groupKey, rockKey]}
                  initialValues={initialValues}
                  innerRef={formRef}
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

  const renderAddRockModalContent = () => {
    return (
      <ModalWrapper
        buttonTitleRight={choicesViewKey ? 'Done' : isShowTemplates ? '' : null}
        closeModal={onCloseModalPressed}
        onActionPressed={saveRock}
        showActionButton={!isShowTemplates && !choicesViewKey}
        showCancelButton={false}
        showCloseButton
      >
        {Object.values(IGNEOUS_ROCK_CLASSES).includes(rockKey) && !choicesViewKey && !isShowTemplates && (
          <ButtonGroup
            buttonStyle={{padding: 5}}
            buttons={Object.values(IGNEOUS_ROCK_CLASSES).map(v => toTitleCase(v))}
            containerStyle={{height: 40, borderRadius: 10}}
            onPress={onIgneousRockTypePress}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            selectedIndex={selectedTypeIndex}
            textStyle={{color: PRIMARY_TEXT_COLOR, fontSize: SMALL_TEXT_SIZE}}
          />
        )}
        {!choicesViewKey && (
          <TemplatesNotebook
            isShowTemplates={isShowTemplates}
            rockKey={rockKey}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
          />
        )}
        {!isShowTemplates && renderAddRock()}
      </ModalWrapper>
    );
  };

  const renderForm = (formProps) => {
    return (
      <>
        {Object.values(IGNEOUS_ROCK_CLASSES).includes(rockKey) && (
          <AddRockIgneousModal
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE && (
          <AddRockAlterationOreModal
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_FAULT && (
          <AddRockFaultModal
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_METAMORPHIC && (
          <AddRockMetamorphicModal
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
        {rockKey === PAGE_KEYS.LITHOLOGIES && (
          <AddRockSedimentaryModal
            choices={choices}
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setChoicesViewKey={setChoicesViewKey}
            survey={survey}
          />
        )}
      </>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form {...formProps} formName={[groupKey, rockKey]} surveyFragment={relevantFields}/>
    );
  };

  /* View */

  return renderAddRockModalContent();
};

export default AddRockModal;
