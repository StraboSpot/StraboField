import React, {useCallback, useRef} from 'react';
import {ScrollView} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';

import commonStyles from '../../shared/common.styles';
import {TextInputField} from '../form';

const QAQCForm = ({formRef, initialQAQCValues, isReadOnly, appearance = 'full', customHeight}) => {
  /* Local State */

  const isFirstFocusRef = useRef(true);
  const scrollViewRef = useRef(null);

  /* Derived State */

  const handleInputFocus = useCallback(() => {
    if (isFirstFocusRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 100);
      isFirstFocusRef.current = false;
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    isFirstFocusRef.current = true;
  }, []);

  /* View */

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{flex: 1}}
    >
      <Formik
        enableReinitialize={true}
        initialValues={initialQAQCValues}
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
                key={'qaqc'}
                name={'qaqc'}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
              />
            </ListItem.Content>
          </ListItem>
        )}
      </Formik>
    </ScrollView>
  );
};

export default QAQCForm;
