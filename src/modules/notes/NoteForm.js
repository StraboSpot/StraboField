import React from 'react';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import {TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues, isReadOnly}) => {
  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialNotesValues}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
    >
      {() => (
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              appearance={'full'}
              autoFocus={true}
              component={TextInputField}
              editable={!isReadOnly}
              key={'note'}
              name={'note'}
            />
          </ListItem.Content>
        </ListItem>
      )}
    </Formik>
  );
};

export default NoteForm;
