import React from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import AcknowledgeInput from './AcknowledgeInput';
import {showFieldInfo} from './form.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DateInputField, NumberInputField, SelectInputField, TextInputField, useForm} from '../form';

const Form = ({
                getIsDisabled,
                errors,
                formName,
                isReadOnly,
                onMyChange,
                scrollEnabled = true,
                setFieldValue,
                subkey,
                surveyFragment,
                values,
              }) => {
  /* Data Hooks */

  const {getChoices, getSurvey, isRelevant} = useForm();

  /* Derived Variables */

  const survey = surveyFragment || getSurvey(formName);

  /* Render Functions */

  const renderAcknowledgeInput = (field) => {
    return (
      <Field
        as={AcknowledgeInput}
        disabled={isReadOnly}
        key={field.name}
        label={field.label}
        name={field.name}
        onShowFieldInfo={showFieldInfo}
        placeholder={field.hint}
        setFieldValue={setFieldValue}
      />
    );
  };

  const renderDateInput = (field, isShowTimeOnly = false) => {
    return (
      <Field
        component={DateInputField}
        isDisplayOnly={isReadOnly}
        isShowTimeOnly={isShowTimeOnly}
        key={field.name}
        label={field.label}
        name={field.name}
        onMyChange={onMyChange}
        setFieldValue={setFieldValue}
      />
    );
  };

  const renderField = (field) => {
    const fieldType = field.type.split(' ')[0];
    return (
      <>
        {fieldType === 'begin_group' && renderGroupHeading(field)}
        {(fieldType === 'text' || fieldType === 'integer' || fieldType === 'decimal' || fieldType === 'select_one'
          || fieldType === 'select_multiple' || fieldType === 'date' || fieldType === 'time'
          || fieldType === 'acknowledge') && (
          <>
            {surveyFragment && (fieldType === 'select_one' || fieldType === 'select_multiple')
              && renderSelectInput(field, true)}
            <ListItem containerStyle={commonStyles.listItemFormField}>
              <ListItem.Content>
                {fieldType === 'text' && renderTextInput(field)}
                {(fieldType === 'integer' || fieldType === 'decimal') && renderNumberInput(field)}
                {(!surveyFragment && (fieldType === 'select_one' || fieldType === 'select_multiple'))
                  && renderSelectInput(field)}
                {fieldType === 'date' && renderDateInput(field)}
                {fieldType === 'time' && renderDateInput(field, true)}
                {fieldType === 'acknowledge' && renderAcknowledgeInput(field)}
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </>
    );
  };

  const renderGroupHeading = field => <SectionDivider dividerText={field.label}/>;

  const renderNumberInput = (field) => {
    return (
      <Field
        component={NumberInputField}
        editable={!isReadOnly}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        onMyChange={onMyChange}
        onShowFieldInfo={showFieldInfo}
        placeholder={field.hint}
      />
    );
  };

  const renderSelectInput = (field, isExpanded) => {
    const isDisabled = getIsDisabled ? getIsDisabled(field.name) : isReadOnly;
    const [fieldType, choicesListName] = field.type.split(' ');
    const fieldChoices = getChoices(formName).filter(choice => choice.list_name === choicesListName);
    const fieldChoicesCopy = JSON.parse(JSON.stringify(fieldChoices));
    fieldChoicesCopy.map((choice) => {
      choice.value = choice.name;
      choice.disabled = isDisabled;
      delete choice.name;
      return choice;
    });

    // Set default values
    if (isEmpty(values[field.name]) && field.default
      && fieldChoicesCopy.map(c => c.value).includes(field.default)) {
      setFieldValue(field.name, field.default, false);
    }

    return (
      <Field
        as={SelectInputField}
        choices={fieldChoicesCopy}
        errors={errors}
        isReadOnly={isReadOnly}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        onMyChange={onMyChange}
        onShowFieldInfo={showFieldInfo}
        placeholder={field.hint}
        setFieldValue={setFieldValue}
        showExpandedChoices={isExpanded}
        single={fieldType === 'select_one'}
      />
    );
  };

  const renderTextInput = (field) => {
    return (
      <Field
        appearance={field.appearance}
        // autoFocus={field.name === 'name'}
        component={TextInputField}
        editable={getIsDisabled ? !getIsDisabled(field.name) : !isReadOnly}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        onMyChange={onMyChange}
        onShowFieldInfo={showFieldInfo}
        placeholder={field.hint}
      />
    );
  };

  /* View */

  return (
    <FlatList
      data={Object.values(survey.filter(item => isRelevant(item, values)))}
      keyExtractor={(item, index) => index.toString()}
      listKey={JSON.stringify(survey)}
      renderItem={({item}) => renderField(item)}
      scrollEnabled={scrollEnabled}
    />
  );
};

export default Form;
