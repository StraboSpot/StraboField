import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import {FormFlatList} from '../../shared/ui';
import {FormikWrapper, TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues, isReadOnly, appearance = 'full', customHeight, isFillHeight}) => {
  /* Derived Variables */

  // In the fill layout (Shortcut Notes modal) only auto-focus a brand-new, empty note, so an existing
  // note opens keyboard-free and can be read/scrolled (tapping in focuses it). Elsewhere (regular Notes
  // page, template editors) keep the original always-focus behavior.
  const autoFocus = isFillHeight ? isEmpty(initialNotesValues?.note) : true;

  /* Render Functions */

  const renderField = fieldAppearance => (
    <FormikWrapper
      enableReinitialize={true}
      initialValues={initialNotesValues}
      innerRef={formRef}
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
    </FormikWrapper>
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
