import React, {useCallback, useEffect, useRef} from 'react';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {KeyboardAwareScrollView, KeyboardController} from 'react-native-keyboard-controller';

import commonStyles from '../../shared/common.styles';
import {TextInputField} from '../form';

const NoteForm = ({formRef, initialNotesValues, isReadOnly, appearance = 'full', customHeight}) => {
  /* Local State */

  const isFirstFocusRef = useRef(true);
  const scrollViewRef = useRef(null);

  /* Derived State */

  const handleInputFocus = useCallback(() => {
    // Only scroll to bottom on first focus
    if (isFirstFocusRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
      isFirstFocusRef.current = false;
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    // Reset flag when input loses focus
    isFirstFocusRef.current = true;
  }, []);

  /* Side Effects */

  useEffect(() => {
    console.log('Keyboard Events', KeyboardController.state());
  }, []);

  /* View */

  return (
    <>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{flex: 1}}
      >
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
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                />
              </ListItem.Content>
            </ListItem>
          )}
        </Formik>
      </KeyboardAwareScrollView>
    </>
  );
};

export default NoteForm;
