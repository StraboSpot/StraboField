import React, {useContext, useRef, useState} from 'react';
import {Text, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import {MEASUREMENT_TEMPLATE_KEY, MEASUREMENT_TEMPLATE_TYPES, TEMPLATE_NAME_FIELD} from './templates.constants';
import useTemplates from './useTemplates';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';
import Form from '../form/Form';
import FormFlatList from '../form/FormFlatList';
import FormikWrapper from '../form/FormikWrapper';
import TextInputField from '../form/inputs/TextInputField';
import useForm from '../form/useForm';
import {MEASUREMENT_GROUP_KEY} from '../measurements/measurements.constants';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {PET_PAGES, SED_PAGES} from '../page/page.constants';
import {IGNEOUS_ROCK_CLASSES} from '../petrology/rocks/rocks.constants';
import {deletedTemplate} from '../project/projects.slice';

const TemplateDetail = ({goBack, template, templateType}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const {validateForm} = useForm();
  const {saveTemplate} = useTemplates();

  // Asks the gate Templates provides. The name is in the same form as the values, so a rename alone asks too.
  const formRef = useRef(null);
  const {isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => 'Your changes to this template haven\'t been saved.',
    save: () => saveTemplateForm(),
  });

  /* Local State */

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);

  /* Derived Variables */

  const isNotes = templateType === 'notes';
  // Igneous rocks are a pet page split in two by rock class, so their template types are the classes themselves
  const isPet = PET_PAGES.some(p => p.key === templateType)
    || Object.values(IGNEOUS_ROCK_CLASSES).includes(templateType);
  const isSed = SED_PAGES.some(p => p.key === templateType);
  const groupKey = isPet ? 'pet' : isSed ? 'sed' : 'general';
  // A measurement template names its own orientation in values.type; every other kind is named by its page. A note
  // has no survey to check.
  const formName = isNotes ? undefined
    : template.values.type ? [MEASUREMENT_GROUP_KEY, template.values.type] : [groupKey, templateType];
  const templateKey = MEASUREMENT_TEMPLATE_TYPES.includes(templateType) ? MEASUREMENT_TEMPLATE_KEY : templateType;

  /* Event Handlers */

  const handleCancelPressed = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    goBack();
  };

  const handleDeletePressed = () => setIsDeleteConfirmModalVisible(true);

  /* Logic Helpers */

  const deleteTemplate = () => {
    dispatch(deletedTemplate({key: templateKey, template: template}));
    goBack();
    setIsDeleteConfirmModalVisible(false);
  };

  // Resolves whether it saved, for the gate as well as Save
  const saveTemplateForm = async () => {
    try {
      await saveTemplate(formRef.current, templateKey, template);
      markSaved();
      return true;
    }
    catch (err) {
      return false;
    }
  };

  const saveTemplateAndGo = async () => {
    if (await saveTemplateForm()) goBack();
  };

  const validateTemplate = (values) => {
    const errors = formName ? validateForm({formName: formName, values: values}).errors : {};
    return isEmpty(values[TEMPLATE_NAME_FIELD]?.trim()) ? {...errors, [TEMPLATE_NAME_FIELD]: 'Required'} : errors;
  };

  /* Render Functions */

  const renderDeleteConfirmationModal = () => {
    return (
      <DeleteConformationDialogBox
        headerTitle={'Confirm Delete!'}
        isVisible={isDeleteConfirmModalVisible}
        onActionPressed={deleteTemplate}
        onCancelPress={() => setIsDeleteConfirmModalVisible(false)}
      >
        <Text style={{textAlign: 'center'}}>Are you sure you want to delete Template {template.name}?</Text>
      </DeleteConformationDialogBox>
    );
  };

  const renderNameField = () => {
    return (
      <View style={{alignContent: 'flex-start'}}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <TextInputField isRequired={true} label={'Template Name'} name={TEMPLATE_NAME_FIELD}/>
            </View>
          </ListItem.Content>
        </ListItem>
      </View>
    );
  };

  const renderNoteField = () => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          <TextInputField appearance={'multiline'} autoFocus={true} customHeight={300} name={'note'}/>
        </ListItem.Content>
      </ListItem>
    );
  };

  // FormFlatList is the single scroll container, so Form renders its fields inline rather than in its own list
  const renderTemplateFields = () => {
    return (
      <FormFlatList>
        <FormikWrapper
          fieldLabels={{[TEMPLATE_NAME_FIELD]: 'Template Name'}}
          formName={formName}
          initialValues={{...template.values, [TEMPLATE_NAME_FIELD]: template.name}}
          innerRef={formRef}
          setIsFormDirty={setIsFormDirty}
          setIsFormInvalid={setIsFormInvalid}
          validate={validateTemplate}
        >
          {formProps => (
            <>
              {renderNameField()}
              {isNotes ? renderNoteField() : <Form {...formProps} formName={formName} renderInline={true}/>}
            </>
          )}
        </FormikWrapper>
        {template?.id && <DeleteButton onPress={handleDeletePressed} title={'Delete Template'}/>}
      </FormFlatList>
    );
  };

  /* View */

  return (
    <>
      <SaveAndCancelButtons cancel={handleCancelPressed} getIsDisabled={isFormInvalid} save={saveTemplateAndGo}/>
      {renderTemplateFields()}

      {/* Child Modal */}
      {isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}
    </>
  );
};

export default TemplateDetail;
