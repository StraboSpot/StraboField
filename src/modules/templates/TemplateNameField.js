import React from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {useFormikContext} from 'formik';

import {TEMPLATE_FIELD_LABELS, TEMPLATE_NAME_FIELD} from './templates.constants';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import TextInputField from '../form/inputs/TextInputField';

// A template form's name field, at the top of the form it names. A new template opens with it focused.
const TemplateNameField = () => {
  const {initialValues} = useFormikContext();

  return (
    <View style={{alignContent: 'flex-start'}}>
      <ListItem containerStyle={commonStyles.listItemFormField}>
        <ListItem.Content
          style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
        >
          <View style={{flex: 1}}>
            <TextInputField
              autoFocus={isEmpty(initialValues[TEMPLATE_NAME_FIELD])}
              isRequired={true}
              label={TEMPLATE_FIELD_LABELS[TEMPLATE_NAME_FIELD]}
              name={TEMPLATE_NAME_FIELD}
            />
          </View>
        </ListItem.Content>
      </ListItem>
    </View>
  );
};

export default TemplateNameField;
