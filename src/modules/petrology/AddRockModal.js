import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {ButtonGroup} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';

import AddRockAlterationOreModal from './AddRockAlterationOreModal';
import AddRockFaultModal from './AddRockFaultModal';
import AddRockIgneousModal from './AddRockIgneousModal';
import AddRockMetamorphicModal from './AddRockMetamorphicModal';
import AddRockSedimentaryModal from './AddRockSedimentaryModal';
import {IGNEOUS_ROCK_CLASSES} from './petrology.constants';
import usePetrology from './usePetrology';
import {getNewId, isEmpty, toTitleCase} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, PRIMARY_TEXT_COLOR} from '../../shared/styles.constants';
import Modal from '../../shared/ui/modal/Modal';
import SaveButton from '../../shared/ui/SaveButton';
import {Form, useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {PAGE_KEYS} from '../page/page.constants';
import useSed from '../sed/useSed';
import Templates from '../templates/Templates';

const AddRockModal = ({
                        modalKey,
                        onPress,
                      }) => {
  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [survey, setSurvey] = useState({});
  const [choices, setChoices] = useState({});
  const [initialValues, setInitialValues] = useState({id: getNewId()});
  const [isShowTemplates, setIsShowTemplates] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [rockKey, setRockKey] = useState(null);
  const formRef = useRef(null);

  const {getChoices, getRelevantFields, getSurvey} = useForm();
  const {savePetFeature, savePetFeatureValuesFromTemplates} = usePetrology();
  const {saveSedFeature, saveSedFeatureValuesFromTemplates} = useSed();

  const areMultipleTemplates = templates[rockKey] && templates[rockKey].isInUse && templates[rockKey].active
    && templates[rockKey].active.length > 1;
  const groupKey = modalKey === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? 'sed' : 'pet';
  const pageKey = modalKey === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? PAGE_KEYS.LITHOLOGIES : modalKey;
  const types = Object.values(IGNEOUS_ROCK_CLASSES);

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
    setSurvey(getSurvey(formName));
    setChoices(getChoices(formName));
    setChoicesViewKey(null);
  }, [modalValues, pageKey, templates]);

  useEffect(() => {
    console.log('UE AddRockModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  const onCloseModalPressed = () => {
    if (choicesViewKey) setChoicesViewKey(null);
    else if (isShowTemplates) setIsShowTemplates(false);
    else dispatch(setModalVisible({modal: null}));
  };

  const onIgneousRockTypePress = (i) => {
    if (i !== selectedTypeIndex) {
      setSelectedTypeIndex(i);
      const type = types[i];
      dispatch(setModalValues({id: getNewId(), igneous_rock_class: type}));
      const formNameSwitched = ['pet', type];
      setSurvey(getSurvey(formNameSwitched));
      setChoices(getChoices(formNameSwitched));
    }
  };

  const renderAddRock = () => {
    const saveRockTitle = 'Save Rock' + (areMultipleTemplates ? 's' : '');
    return (
      <>
        {!areMultipleTemplates && (
          <FlatList
            bounces={false}
            ListHeaderComponent={
              <View style={{flex: 1}}>
                <Formik
                  innerRef={formRef}
                  initialValues={initialValues}
                  onSubmit={values => console.log('Submitting form...', values)}
                  enableReinitialize={true}
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
        )}
        {!choicesViewKey && <SaveButton title={saveRockTitle} onPress={saveRock}/>}
      </>
    );
  };

  const renderAddRockModalContent = () => {
    return (
      <Modal
        closeModal={onCloseModalPressed}
        buttonTitleRight={choicesViewKey ? 'Done' : isShowTemplates ? '' : null}
        onPress={onPress}
      >
        {Object.values(IGNEOUS_ROCK_CLASSES).includes(rockKey) && !choicesViewKey && !isShowTemplates && (
          <ButtonGroup
            selectedIndex={selectedTypeIndex}
            onPress={onIgneousRockTypePress}
            buttons={Object.values(IGNEOUS_ROCK_CLASSES).map(v => toTitleCase(v))}
            containerStyle={{height: 40, borderRadius: 10}}
            buttonStyle={{padding: 5}}
            selectedButtonStyle={{backgroundColor: PRIMARY_ACCENT_COLOR}}
            textStyle={{color: PRIMARY_TEXT_COLOR}}
          />
        )}
        {!choicesViewKey && (
          <Templates
            isShowTemplates={isShowTemplates}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
            rockKey={rockKey}
          />
        )}
        {!isShowTemplates && renderAddRock()}
      </Modal>
    );
  };

  const renderForm = (formProps) => {
    return (
      <>
        {Object.values(IGNEOUS_ROCK_CLASSES).includes(rockKey) && (
          <AddRockIgneousModal
            survey={survey}
            choices={choices}
            setChoicesViewKey={setChoicesViewKey}
            formName={[groupKey, rockKey]}
            formProps={formProps}
            setPetKey={setRockKey}
            setSurvey={setSurvey}
            setChoices={setChoices}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_ALTERATION_ORE && (
          <AddRockAlterationOreModal
            survey={survey}
            choices={choices}
            setChoicesViewKey={setChoicesViewKey}
            formName={[groupKey, rockKey]}
            formProps={formProps}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_FAULT && (
          <AddRockFaultModal
            survey={survey}
            choices={choices}
            setChoicesViewKey={setChoicesViewKey}
            formName={[groupKey, rockKey]}
            formProps={formProps}
          />
        )}
        {rockKey === PAGE_KEYS.ROCK_TYPE_METAMORPHIC && (
          <AddRockMetamorphicModal
            survey={survey}
            choices={choices}
            setChoicesViewKey={setChoicesViewKey}
            formName={[groupKey, rockKey]}
            formProps={formProps}
          />
        )}
        {rockKey === PAGE_KEYS.LITHOLOGIES && (
          <AddRockSedimentaryModal
            survey={survey}
            choices={choices}
            setChoicesViewKey={setChoicesViewKey}
            formName={[groupKey, rockKey]}
            formProps={formProps}
          />
        )}
      </>
    );
  };

  const renderSubform = (formProps) => {
    const relevantFields = getRelevantFields(survey, choicesViewKey);
    return (
      <Form {...{formName: [groupKey, rockKey], surveyFragment: relevantFields, ...formProps}}/>
    );
  };

  const saveRock = async () => {
    if (areMultipleTemplates) {
      if (groupKey === 'pet') savePetFeatureValuesFromTemplates(pageKey, spot, templates[rockKey].active);
      else if (groupKey === 'sed') saveSedFeatureValuesFromTemplates(pageKey, spot, templates[rockKey].active);
    }
    else {
      if (groupKey === 'pet') await savePetFeature(pageKey, spot, formRef.current);
      else if (groupKey === 'sed') await saveSedFeature(pageKey, spot, formRef.current);
      dispatch(setModalValues({...formRef.current.values, id: getNewId()}));
    }
  };

  return renderAddRockModalContent();
};

export default AddRockModal;
