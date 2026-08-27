import React, {useRef, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {FormFlatList} from '../../shared/ui';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, formStyles, FormikWrapper} from '../form';
import useTemplates from './useTemplates';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';
import NoteForm from '../notes/NoteForm';
import {PET_PAGES, SED_PAGES} from '../page/page.constants';
import {deletedTemplate} from '../project/projects.slice';

const TemplateDetail = ({goBack, template, templateType}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const {saveTemplate} = useTemplates();

  /* Local State */

  const formRef = useRef(null);

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [templateName, setTemplateName] = useState(template.name);

  /* Derived Variables */

  const isPet = PET_PAGES.find(p => p.key === templateType)
    || templateType === 'plutonic' || templateType === 'volcanic';
  const isSed = SED_PAGES.find(p => p.key === templateType);
  const groupKey = isPet ? 'pet' : isSed ? 'sed' : 'general';
  const formName = template.values.type ? ['measurement', template.values.type] : [groupKey, templateType];
  const templateKey = templateType === 'planar_orientation' || templateType === 'linear_orientation'
    || templateType === 'tabular_orientation' ? 'measurementTemplates' : templateType;

  /* Event Handlers */

  const handleDeletePressed = () => setIsDeleteConfirmModalVisible(true);

  /* Logic Helpers */

  const deleteTemplate = () => {
    dispatch(deletedTemplate({key: templateKey, template: template}));
    goBack();
    setIsDeleteConfirmModalVisible(false);
  };

  const saveTemplateAndGo = async () => {
    console.log('Saving', templateType, templateName, formRef.current.values);
    try {
      await saveTemplate(formRef.current, templateKey, template, templateName);
      goBack();
    }
    catch (err) {
    }
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
        <Text style={{textAlign: 'center'}}>Are you sure you want to delete Template {templateName}?</Text>
      </DeleteConformationDialogBox>
    );
  };

  // Template Name Field
  const renderNameField = () => {
    return (
      <View style={{alignContent: 'flex-start'}}>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content
            style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View style={{flex: 1}}>
              <View style={formStyles.fieldLabelContainer}>
                <Text style={formStyles.fieldLabel}>{'Template Name'}</Text>
              </View>
              <TextInput
                onChangeText={text => setTemplateName(text)}
                style={formStyles.fieldValue}
                value={templateName}
              />
            </View>
          </ListItem.Content>
        </ListItem>
      </View>
    );
  };

  const renderTemplateFields = () => {
    // NoteForm supplies its own FormFlatList, so the notes template must not be wrapped in a second one.
    if (templateType === 'notes') {
      return (
        <>
          {renderNameField()}
          <NoteForm
            appearance={'multiline'}
            customHeight={300}
            formRef={formRef}
            initialNotesValues={template.values}
          />
          {template?.id && <DeleteButton onPress={handleDeletePressed} title={'Delete Template'}/>}
        </>
      );
    }

    // FormFlatList is the single scroll container, so Form renders its fields inline rather than in its own list.
    return (
      <FormFlatList>
        {renderNameField()}
        <FormikWrapper
          enableReinitialize={false}  // Update values if preferences change while form open, like when number incremented
          formName={formName}
          initialValues={template.values}
          innerRef={formRef}
          setIsFormInvalid={setIsFormInvalid}
        >
          {formProps => <Form {...formProps} formName={formName} renderInline={true}/>}
        </FormikWrapper>
        {template?.id && <DeleteButton onPress={handleDeletePressed} title={'Delete Template'}/>}
      </FormFlatList>
    );
  };

  /* View */

  return (
    <>
      <SaveAndCancelButtons cancel={goBack} getIsDisabled={isFormInvalid} save={saveTemplateAndGo}/>
      {renderTemplateFields()}

      {/* Child Modal */}
      {isDeleteConfirmModalVisible && renderDeleteConfirmationModal()}
    </>
  );
};

export default TemplateDetail;
