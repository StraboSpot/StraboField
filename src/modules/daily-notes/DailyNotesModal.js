import React, {useRef} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import FormikWrapper from '../form/FormikWrapper';
import DateInputField from '../form/inputs/DateInputField';
import TextInputField from '../form/inputs/TextInputField';
import {updatedProject} from '../project/projects.slice';

// dailyNote is the note to edit, or {} to add a new one
const DailyNotesModal = ({closeModal, dailyNote}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const projectDescription = useSelector(state => state.project.project?.description);

  /* Local State */

  const formRef = useRef(null);

  /* Derived Variables */

  // Formik reads these only on mount, and the modal mounts once per note, so a new note keeps the date it opened with
  const initialValues = {...dailyNote, date: dailyNote.date || new Date().toISOString()};

  /* Logic Helpers */

  const deleteNote = () => {
    const dailyNotes = JSON.parse(JSON.stringify(projectDescription.daily_setup || []));
    const dailyNotesFiltered = dailyNotes.filter(n => n.date !== dailyNote.date);
    let projectDescriptionUpdated = JSON.parse(JSON.stringify(projectDescription));
    if (isEmpty(dailyNotesFiltered)) delete projectDescriptionUpdated.daily_setup;
    else projectDescriptionUpdated = {...projectDescription, daily_setup: dailyNotesFiltered};
    dispatch(updatedProject({field: 'description', value: projectDescriptionUpdated}));
    closeModal();
  };

  const deleteNoteConfirm = () => {
    alert('Delete Note',
      'Are you sure you would like to delete this note?',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', onPress: deleteNote},
      ],
      {cancelable: false},
    );
  };

  const saveNote = (values) => {
    const dailyNotes = JSON.parse(JSON.stringify(projectDescription.daily_setup || []));
    const dailyNotesFiltered = dailyNotes.filter(n => n.date !== values.date);
    const dailyNotesUpdated = [...dailyNotesFiltered, values];
    const projectDescriptionUpdated = {...projectDescription, daily_setup: dailyNotesUpdated};
    dispatch(updatedProject({field: 'description', value: projectDescriptionUpdated}));
    closeModal();
  };

  /* Render Functions */

  const renderDailyNotesModal = () => {
    return (
      <ModalWrapper
        headerTitle={'Daily Notes'}
        onActionPressed={() => saveNote(formRef?.current?.values)}
        onCancelPress={closeModal}
        onDeletePress={deleteNoteConfirm}
        overlayStyleOverride={{height: 'auto'}}
        showDeleteButton={!isEmpty(dailyNote)}
      >
        <FormikWrapper
          initialValues={initialValues}
          innerRef={formRef}
        >
          <View>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <DateInputField
                  isDisplayOnly={true}
                  isShowTime={true}
                  label={'Date'}
                  name={'date'}
                />
              </ListItem.Content>
            </ListItem>
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                <TextInputField
                  appearance={'multiline'}
                  label={'Notes'}
                  name={'notes'}
                />
              </ListItem.Content>
            </ListItem>
          </View>
        </FormikWrapper>
      </ModalWrapper>
    );
  };

  /* View */

  return renderDailyNotesModal();
};

export default DailyNotesModal;
