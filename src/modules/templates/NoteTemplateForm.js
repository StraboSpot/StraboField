import React, {useContext, useRef} from 'react';
import {ScrollView} from 'react-native';

import {ListItem} from '@rn-vui/base';

import TemplateNameField from './TemplateNameField';
import {TEMPLATE_FIELD_LABELS, TEMPLATE_NAME_FIELD} from './templates.constants';
import {validateTemplateName} from './templates.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FormikWrapper from '../form/FormikWrapper';
import TextInputField from '../form/inputs/TextInputField';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';

// A notes template's form, as TemplatesPicker shows it. Asks the gate TemplatesPicker provides before Cancel leaves.
// deleteTemplate is given once the template has been saved.
const NoteTemplateForm = ({closeForm, deleteTemplate, initialValues, saveTemplate}) => {
  /* Data Hooks */

  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const formRef = useRef(null);
  const {isFormDirty, isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => 'Your changes to this note template haven\'t been saved.',
    save: () => saveTemplateForm(),
  });

  /* Event Handlers */

  const handleCancelPressed = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    closeForm();
  };

  /* Logic Helpers */

  // Always resolves true for the gate, which already holds Save while the name is missing
  const saveTemplateForm = async () => {
    markSaved();
    saveTemplate(formRef.current.values);
    return true;
  };

  /* View */

  return (
    <ScrollView>
      {/* Nothing changed means nothing to save */}
      <SaveAndCancelButtons
        cancel={handleCancelPressed}
        getIsDisabled={isFormInvalid || !isFormDirty}
        save={saveTemplateForm}
      />
      <FormikWrapper
        fieldLabels={TEMPLATE_FIELD_LABELS}
        initialValues={initialValues}
        innerRef={formRef}
        setIsFormDirty={setIsFormDirty}
        setIsFormInvalid={setIsFormInvalid}
        validate={validateTemplateName}
      >
        <TemplateNameField/>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            {/* The name takes the focus while a new template still needs one */}
            <TextInputField
              appearance={'multiline'}
              autoFocus={!isEmpty(initialValues[TEMPLATE_NAME_FIELD])}
              customHeight={300}
              name={'note'}
            />
          </ListItem.Content>
        </ListItem>
      </FormikWrapper>
      {deleteTemplate && <DeleteButton onPress={deleteTemplate} title={'Delete Notes Template'}/>}
    </ScrollView>
  );
};

export default NoteTemplateForm;
