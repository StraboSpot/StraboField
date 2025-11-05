import React, {useRef, useState} from 'react';
import {Text, TextInput, View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {Form, formStyles, useForm} from '../form';
import useTemplates from './useTemplates';
import NoteForm from '../notes/NoteForm';
import {PET_PAGES, SED_PAGES} from '../page/page.constants';

const TemplateDetail = ({goBack, template, templateType}) => {

  const [templateName, setTemplateName] = useState(template.name);

  const {validateForm} = useForm();
  const {saveTemplate} = useTemplates();

  const formRef = useRef(null);

  const isPet = PET_PAGES.find(
    p => p.key === templateType) || templateType === 'plutonic' || templateType === 'volcanic';
  const isSed = SED_PAGES.find(p => p.key === templateType);
  const groupKey = isPet ? 'pet' : isSed ? 'sed' : 'general';

  const formName = template.values.type ? ['measurement', template.values.type] : [groupKey, templateType];

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

  const saveTemplateAndGo = async () => {
    console.log('Saving', templateType, templateName, formRef.current.values);
    try {
      const templateKey = templateType === 'planar_orientation' || templateType === 'linear_orientation'
      || templateType === 'tabular_orientation' ? 'measurementTemplates' : templateType;
      await saveTemplate(formRef.current, templateKey, template, templateName);
      goBack();
    }
    catch (error) {
    }
  };

  return (
    <>
      <SaveAndCancelButtons cancel={goBack} save={saveTemplateAndGo}/>
      {renderNameField()}
      {templateType === 'notes' ? (
        <NoteForm
          appearance={'multiline'}
          customHeight={300}
          formRef={formRef}
          initialNotesValues={template.values}
        />
      ) : (
        <Formik
          enableReinitialize={false}  // Update values if preferences change while form open, like when number incremented
          initialValues={template.values}
          innerRef={formRef}
          onSubmit={values => console.log('Submitting form...', values)}
          validate={values => validateForm({formName: formName, values: values})}
          validateOnChange={true}
        >
          {formProps => <Form {...{...formProps, formName: formName}}/>}
        </Formik>
      )}
    </>
  );
};

export default TemplateDetail;
