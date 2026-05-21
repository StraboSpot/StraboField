import React from 'react';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import {FormFlatList} from '../../shared/ui';
import {TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues, isReadOnly, appearance = 'full', customHeight}) => {
  /* View */

  return (
    <FormFlatList style={{flex: 1}}>
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
                appearance={appearance}
                autoFocus={true}
                component={TextInputField}
                customHeight={customHeight}
                editable={!isReadOnly}
                key={'note'}
                name={'note'}
              />
            </ListItem.Content>
          </ListItem>
        )}
      </Formik>
    </FormFlatList>
  );
};

export default NoteForm;
