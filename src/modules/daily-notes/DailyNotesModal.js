import React, {useRef} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {DateInputField, TextInputField} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {updatedProject} from '../project/projects.slice';

const DailyNotesModal = () => {
  const dispatch = useDispatch();
  const modalValues = useSelector(state => state.home.modalValues);
  const projectDescription = useSelector(state => state.project.project?.description);

  const formRef = useRef(null);

  const initialValues = {...modalValues, date: modalValues.date || new Date().toISOString()};

  const close = () => {
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: null}));
  };

  const deleteNote = (values) => {
    const dailyNotes = JSON.parse(JSON.stringify(projectDescription.daily_setup || []));
    const dailyNotesFiltered = dailyNotes.filter(n => n.date !== values.date);
    let projectDescriptionUpdated = JSON.parse(JSON.stringify(projectDescription));
    if (isEmpty(dailyNotesFiltered)) delete projectDescriptionUpdated.daily_setup;
    else projectDescriptionUpdated = {...projectDescription, daily_setup: dailyNotesFiltered};
    dispatch(updatedProject({field: 'description', value: projectDescriptionUpdated}));
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: null}));
  };

  const deleteNoteConfirm = () => {
    alert('Delete Note',
      'Are you sure you would like to delete this note?',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', onPress: () => deleteNote(formRef?.current?.values)},
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
    dispatch(setModalValues({}));
    dispatch(setModalVisible({modal: null}));
  };

  const renderDailyNotesModal = () => {
    return (
      <ModalWrapper
        onActionPressed={() => saveNote(formRef?.current?.values)}
        onCancelPress={close}
        onDeletePress={deleteNoteConfirm}
        overlayStyleOverride={{height: 'auto'}}
        showDeleteButton={!isEmpty(projectDescription?.daily_setup)}
      >
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          innerRef={formRef}
          onSubmit={() => console.log('Submitting form...')}
          validateOnChange={true}
        >
          {() => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={DateInputField}
                    isDisplayOnly={true}
                    isShowTime={true}
                    key={'date'}
                    label={'Date'}
                    name={'date'}
                  />
                </ListItem.Content>
              </ListItem>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    appearance={'multiline'}
                    component={TextInputField}
                    key={'notes'}
                    label={'Notes'}
                    name={'notes'}
                  />
                </ListItem.Content>
              </ListItem>
            </View>
          )}
        </Formik>
      </ModalWrapper>
    );
  };

  return renderDailyNotesModal();
};

export default DailyNotesModal;
