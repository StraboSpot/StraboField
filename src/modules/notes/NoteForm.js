import React from 'react';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import {TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues}) => {
  return (
    <Formik
      initialValues={initialNotesValues}
      onSubmit={values => console.log('Submitting form...', values)}
      innerRef={formRef}
      enableReinitialize={true}
    >
      {() => (
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={TextInputField}
              name={'note'}
              key={'note'}
              appearance={'full'}
              autoFocus={true}
            />
          </ListItem.Content>
        </ListItem>
      )}
    </Formik>
  );
};

export default NoteForm;
