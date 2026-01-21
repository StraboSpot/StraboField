import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FlatList, KeyboardAvoidingView, Platform, Text, View} from 'react-native';

import {Formik} from 'formik';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {PAGE_KEYS} from './page.constants';
import {isEmpty, toTitleCase} from '../../shared/Helpers';
import {RED} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {overlayStyles} from '../home/overlays';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import usePetrology from '../petrology/usePetrology';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import IGSNModal from '../samples/IGSNModal';
import IGSNUploadAndRegister from '../samples/IGSNUploadAndRegister';
import useSamples from '../samples/useSamples';
import {LITHOLOGY_SUBPAGES} from '../sed/sed.constants';
import useSed from '../sed/useSed';
import {useSpots} from '../spots';
import {editedSpotProperties, setSelectedAttributes} from '../spots/spots.slice';
import {useTags} from '../tags';
import {messages} from './ui/Messages';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';


const BasicPageDetail = ({
                           PageTabsComponent,
                           closeDetailView,
                           deleteTemplate,
                           groupKey = 'general',
                           isReadOnly,
                           page,
                           saveTemplate,
                           selectedFeature,
                         }) => {
    const dispatch = useDispatch();
    const spot = useSelector(state => state.spot.selectedSpot);
    const {isInternetReachable} = useSelector(state => state.connections.isOnline);
    const {sesar, encoded_login} = useSelector(state => state.user);

    const [isIGSNChecked, setIsIGSNChecked] = useState(selectedFeature.isOnMySesar || false);
    const [isDeleteOverlayVisible, setIsDeleteOverlayVisible] = useState(false);
    const [isIGSNModalVisible, setIsIGSNModalVisible] = useState(false);

    const {showErrors, validateForm} = useForm();
    const {deletePetFeature, onMineralChange, savePetFeature} = usePetrology();
    const {onSampleFormChange} = useSamples();
    const {deleteSedFeature, onSedFormChange, saveSedBedFeature, saveSedFeature} = useSed();
    const {checkSampleName} = useSpots();
    const {deleteFeatureTags} = useTags();

    const formRef = useRef(null);
    const toast = useToast();

    const [initialValues, setInitialValues] = useState({});

    const pageKey = page.key === PAGE_KEYS.FABRICS && selectedFeature.type === 'fabric' ? '_3d_structures'
      : page.key === PAGE_KEYS.ROCK_TYPE_SEDIMENTARY ? PAGE_KEYS.LITHOLOGIES : page.key;
    let pageData = pageKey === PAGE_KEYS.NOTES ? {} : [];
    if (spot && spot.properties) {
      if (spot.properties[groupKey] && spot.properties[groupKey][pageKey]) pageData = spot.properties[groupKey][pageKey];
      else if (spot.properties[pageKey]) pageData = spot.properties[pageKey];
    }
    const title = groupKey === 'pet' && pageKey === PAGE_KEYS.ROCK_TYPE_IGNEOUS
    && !selectedFeature.rock_type && selectedFeature.igneous_rock_class
      ? toTitleCase(selectedFeature.igneous_rock_class.replace('_', ' ') + ' Rock')
      : page.label_singular || toTitleCase(page.label).slice(0, -1);

    const isTemplate = saveTemplate;

    useLayoutEffect(() => {
      console.log('ULE BasicPageDetail []');
      return () => !isReadOnly && confirmLeavePage();
    }, []);

    useEffect(() => {
      console.log('UE BasicPageDetail []');
      setInitialValues(selectedFeature);
      return () => dispatch(setSelectedAttributes([]));
    }, []);

    useEffect(() => {
      console.log('UE BasicPageDetail [selectedFeature]', selectedFeature);
      setInitialValues(selectedFeature);
      if (!isTemplate && isEmpty(selectedFeature)) closeDetailView();
    }, [selectedFeature]);

    useEffect(() => {
      checkIfIsDisabled();
    }, [sesar.sesarToken.access]);

    const cancelForm = async () => {
      closeDetailView();
    };

    const checkIfIsDisabled = () => {
      console.log('Checking is NOT on MYSESAR...' + !selectedFeature.isOnMySesar);
      console.log('Checking is Selected user code empty...' + isEmpty(sesar.selectedUserCode));

      if (!isIGSNChecked) return false;

      if (!sesar.sesarToken.access) return true;

      if (isEmpty(sesar.selectedUserCode)) {
        return !(selectedFeature.isOnMySesar && isInternetReachable);
      }

      return false;
    };

    const confirmLeavePage = () => {
      const description = isIGSNChecked
        ? 'Would you like to save your data before continuing? \n\n This sample was not registered to SESAR. Please re-save sample to register to SESAR.'
        : 'Would you like to save your data before continuing?';
      if (!isTemplate && formRef.current && formRef.current.dirty) {
        const formCurrent = formRef.current;
        alert('Unsaved Changes',
          description,
          [{
            text: 'No',
            style: 'cancel',
          }, {
            text: 'Yes',
            onPress: () => saveForm(formCurrent),
          }],
          {cancelable: false},
        );
      }
    };

    const deleteFeature = () => {
      deleteFeatureTags([selectedFeature]);
      if (groupKey === 'pet') deletePetFeature(pageKey, spot, selectedFeature);
      else if (groupKey === 'sed') deleteSedFeature(pageKey, spot, selectedFeature);
      else {
        let editedPageData = pageData ? JSON.parse(JSON.stringify(pageData)) : [];
        editedPageData = editedPageData.filter(f => f.id !== selectedFeature.id);
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: pageKey, value: editedPageData}));
      }
      dispatch(setSelectedAttributes([]));
      closeDetailView();
    };

    const deleteFeatureConfirm = () => {
      if (pageKey === PAGE_KEYS.SAMPLES && selectedFeature.isOnMySesar) {
        setIsDeleteOverlayVisible(true);
      }
      else {
        alert('Delete ' + title,
          'Are you sure you would like to delete this ' + title + '?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: () => deleteFeature(),
            },
          ],
          {cancelable: false},
        );
      }
    };

    const handleIGSNChecked = (value) => {
      setIsIGSNChecked(value);
    };

    const getFormName = () => {
      let formName = [groupKey, pageKey];
      if (groupKey === 'pet' && selectedFeature.rock_type) formName = ['pet_deprecated', pageKey];
      else if (groupKey === 'pet' && pageKey === 'igneous') formName = [groupKey, selectedFeature.igneous_rock_class];
      else if (pageKey === '_3d_structures' || pageKey === 'fabrics') formName = [pageKey, selectedFeature.type];
      else if (page.subkey) formName = [pageKey, page.subkey];
      console.log('Rendering form:', formName[0] + '.' + formName[1]);
      return formName;
    };

    const getIsDisabled = (fieldName) => {
      if (isReadOnly) return true;
      else {
        return selectedFeature.isOnMySesar && selectedFeature.Sample_IGSN
          ? isInternetReachable
            ? fieldName === 'Sample_IGSN' : true
          : false;
      }
    };

    const renderIGSNUpload = () => {
      return (
        <>
          {!isEmpty(encoded_login) ? (
            <IGSNUploadAndRegister
              handleIGSNChecked={handleIGSNChecked}
              isIGSNChecked={isIGSNChecked}
              selectedFeature={selectedFeature}
            />
          ) : (
            <Text style={{textAlign: 'center', padding: 20, fontSize: 16}}>
              You need to login to StraboSpot to upload to SESAR
            </Text>
          )}
        </>
      );
    };

    const onSubmitForm = (values, {resetForm}) => {
      console.log('Submitting form...', values);
      setInitialValues(values);
      resetForm({values});
      console.log('Reset form...');
    };

    const renderFormFields = () => {
      const formName = getFormName();
      return (
        <View style={{flex: 1}}>
          {page.key === PAGE_KEYS.SAMPLES && Platform.OS !== 'web' && !isReadOnly && spot.geometry.type !== 'Polygon' && renderIGSNUpload()}
          <Formik
            enableReinitialize={true}
            initialStatus={{formName: formName}}
            initialValues={initialValues}
            innerRef={formRef}
            onReset={() => console.log('Resetting form...')}
            onSubmit={onSubmitForm}
            validate={values => validateForm({formName: formName, values: values})}
          >
            {formProps => (
              <>
                <Form {...{
                  ...formProps,
                  formName: formName,
                  isReadOnly: isReadOnly,
                  onMyChange: page.key === PAGE_KEYS.MINERALS
                    ? ((name, value) => onMineralChange(formRef.current, name, value))
                    : page.key === LITHOLOGY_SUBPAGES.LITHOLOGY
                      ? ((name, value) => onSedFormChange(formRef.current, name, value))
                      : page.key === PAGE_KEYS.SAMPLES
                        ? ((name, value) => onSampleFormChange(formRef.current, name, value))
                        : undefined
                  ,
                  getIsDisabled: getIsDisabled,
                }}/>
              </>
            )}
          </Formik>
          {!isReadOnly && (
            <DeleteButton
              onPress={() => isTemplate ? deleteTemplate() : deleteFeatureConfirm()}
              title={'Delete ' + title + (isTemplate ? ' Template' : '')}
            />
          )}
        </View>
      );
    };

    const saveButtonOnPress = () => {
      isTemplate ? saveTemplateForm(formRef.current) : saveForm(formRef.current);
    };

    const updateIGSNAndShowModal = async (formCurrent) => {
      setIsIGSNModalVisible(true);
      console.log('setting form values for IGSN modals');
      await formCurrent.setValues({...formCurrent.values, sesarUserCode: sesar.selectedUserCode});
      console.log('FORMREF.CURRENT.VALUES', formCurrent.values);
    };

    const saveFeature = async (formCurrent) => {
      try {
        await formCurrent.submitForm();
        const editedFeatureData = showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
        console.log('Saving', page.label, 'data', editedFeatureData, 'to Spot', pageData);
        let editedPageData = pageData ? JSON.parse(JSON.stringify(pageData)) : [];
        const i = editedPageData.findIndex(f => f.id === editedFeatureData.id);
        if (i === -1) editedPageData.push(editedFeatureData);
        else editedPageData.splice(i, 1, editedFeatureData);
        const spotId = spot.properties.id;
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: pageKey, value: editedPageData, spotId: spotId}));

        if (page.key === PAGE_KEYS.SAMPLES && editedFeatureData.sample_id_name) {
          await checkSampleName(editedFeatureData.sample_id_name);
        }
      }
      catch (err) {
        console.log('Error saving', pageKey, err);
        throw Error;
      }
    };

    const saveForm = async (formCurrent) => {
      try {
        if (formCurrent?.values.isOnMySesar || isIGSNChecked) await updateIGSNAndShowModal(formCurrent);
        else {
          if (groupKey === 'pet') {
            await savePetFeature(pageKey, spot, formRef.current || formCurrent, isEmpty(formRef.current));
          }
          else if (groupKey === 'sed' && pageKey === 'bedding') {
            await saveSedBedFeature(pageKey, spot, formRef.current || formCurrent, isEmpty(formRef.current));
          }
          else if (groupKey === 'sed') {
            await saveSedFeature(pageKey, spot, formRef.current || formCurrent, isEmpty(formRef.current));
          }
          else await saveFeature(formCurrent);
          closeDetailView();
          if (Platform.OS !== 'web') toast.show('Changes Saved', {type: 'success'});
          console.log('Done');
        }
      }
      catch (err) {
        toast.show('Error Saving Changes', {type: 'danger'});
        console.error('ERROR saving form', err);
      }
    };

    const onSampleSaved = async (formCurrent) => {
      console.log('Saving Sample To SESAR', formRef.current?.values);
      await saveFeature(formCurrent);
      closeDetailView();
    };

    const saveTemplateForm = async (formCurrent) => {
      await formCurrent.submitForm();
      const formValues = showErrors(formRef.current || formCurrent, isEmpty(formRef.current));
      saveTemplate(formValues);
    };

    return (
      <>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust offset as needed
          style={{flex: 1}} // Important for padding behavior
        >
          {(isTemplate || !isEmpty(selectedFeature)) && (
            <>
              <NotebookPageHeader hideBackButton={!isReadOnly} onPressBack={cancelForm} pageTitle={title + ' Detail'}/>
              {PageTabsComponent && PageTabsComponent}
              {!isReadOnly && (
                <SaveAndCancelButtons
                  cancel={cancelForm}
                  getIsDisabled={checkIfIsDisabled()}
                  save={saveButtonOnPress}
                />
              )}
              <FlatList
                ListHeaderComponent={renderFormFields()}
                contentContainerStyle={{paddingBottom: 200}}
              />
            </>
          )}
          {/*{isIGSNModalVisible && (*/}
          <IGSNModal
            isVisible={isIGSNModalVisible}
            onModalCancel={() => setIsIGSNModalVisible(false)}
            onSampleSaved={onSampleSaved}
            ref={formRef}
            sampleValues={formRef.current?.values}
          />
          {/*)}*/}
          {/*Modal when deleting a sample with an IGSN attached*/}
          <ModalWrapper
            actionTitle={'Delete'}
            headerTitle={'Delete Sample'}
            isVisible={isDeleteOverlayVisible}
            onActionPressed={deleteFeature}
            onCancelPress={() => setIsDeleteOverlayVisible(false)}
            overlayStyleOverride={{height: '40%'}}
          >
            <View style={{
              flex: 1,
              paddingVertical: 10,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'yellow',
            }}>
              <Text style={{...overlayStyles.titleText, color: RED}}>WARNING!</Text>
              <Text style={{...overlayStyles.titleText, color: RED}}>{messages.delete.title}</Text>
            </View>
            <View style={{flex: 4, justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{...overlayStyles.statusMessageText, fontSize: 16, fontWeight: '500'}}>{messages.delete.message}
              </Text>
            </View>
          </ModalWrapper>
        </KeyboardAvoidingView>
      </>
    );
  }
;

export default BasicPageDetail;
