import React, {useContext, useRef} from 'react';
import {ScrollView} from 'react-native';

import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import NoteForm from '../notes/NoteForm';

// A notes template's form, as TemplatesPicker shows it. Asks the gate TemplatesPicker provides before Cancel leaves.
const NoteTemplateForm = ({closeForm, initialNotesValues, isTemplateNameChanged, saveTemplate}) => {
  /* Data Hooks */

  const {confirmLeavePage, hasUnsavedPageChanges} = useContext(LeavePageContext);

  const formRef = useRef(null);
  const {markSaved, setIsFormDirty} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => 'Your changes to this note template haven\'t been saved.',
    isChangedOutsideForm: isTemplateNameChanged,
    save: () => saveTemplateForm(),
  });

  /* Event Handlers */

  const handleCancelPressed = async () => {
    if (hasUnsavedPageChanges() && !await confirmLeavePage()) return;
    closeForm();
  };

  /* Logic Helpers */

  // Always resolves true for the gate: a note has nothing to refuse
  const saveTemplateForm = async () => {
    markSaved();
    saveTemplate(formRef.current.values);
    return true;
  };

  /* View */

  return (
    <ScrollView>
      <SaveAndCancelButtons cancel={handleCancelPressed} save={saveTemplateForm}/>
      <NoteForm
        appearance={'multiline'}
        customHeight={300}
        formRef={formRef}
        initialNotesValues={initialNotesValues}
        setIsFormDirty={setIsFormDirty}
      />
    </ScrollView>
  );
};

export default NoteTemplateForm;
