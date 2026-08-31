import React, {useCallback, useRef} from 'react';
import {ScrollView} from 'react-native';

import {ListItem} from '@rn-vui/base';

import commonStyles from '../../shared/common.styles';
import {FormikWrapper, TextInputField} from '../form';

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
      <FormikWrapper
        enableReinitialize={true}
        initialValues={initialQAQCValues}
        innerRef={formRef}
      >
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <TextInputField
              appearance={appearance}
              autoFocus={true}
              customHeight={customHeight}
              editable={!isReadOnly}
              name={'qaqc'}
              onBlurred={handleInputBlur}
              onFocused={handleInputFocus}
            />
          </ListItem.Content>
        </ListItem>
      </FormikWrapper>
    </ScrollView>
  );
};

export default QAQCForm;
