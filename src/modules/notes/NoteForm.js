import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {FormFlatList} from '../../shared/ui';
import {TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues, isReadOnly, appearance = 'full', customHeight, isFillHeight}) => {
  /* Derived Variables */

  // Only auto-focus (and pop the keyboard) for a brand-new, empty note. An existing note opens
  // keyboard-free so it can be read and scrolled; tapping into it focuses and shows the keyboard.
  const autoFocus = isEmpty(initialNotesValues?.note);

  /* Render Functions */

  const renderField = fieldAppearance => (
    <Formik
      enableReinitialize={true}
      initialValues={initialNotesValues}
      innerRef={formRef}
      onSubmit={values => console.log('Submitting form...', values)}
    >
      {() => (
        <Field
          appearance={fieldAppearance}
          autoFocus={autoFocus}
          component={TextInputField}
          customHeight={customHeight}
          editable={!isReadOnly}
          key={'note'}
          name={'note'}
        />
      )}
    </Formik>
  );

  /* View */

  // Fill the available height so the text field is the only scrollable region (its internal scroll
  // handles long notes) and any sibling footer stays sticky.
  if (isFillHeight) {
    return (
      <View style={[commonStyles.listItemFormField, {flex: 1}]}>
        {renderField('fill')}
      </View>
    );
  }

  return (
    <FormFlatList style={{flex: 1}}>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content>
          {renderField(appearance)}
        </ListItem.Content>
      </ListItem>
    </FormFlatList>
  );
};

export default NoteForm;
