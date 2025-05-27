import React from 'react';
import {FlatList} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import AcknowledgeInput from './AcknowledgeInput';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DateInputField, NumberInputField, SelectInputField, TextInputField, useForm} from '../form';
import {LABELS_WITH_ABBREVIATIONS} from '../petrology/petrology.constants';

const Form = ({
                getIsDisabled,
                errors,
                formName,
                onMyChange,
                setFieldValue,
                subkey,
                surveyFragment,
                values,
              }) => {
  const {getChoices, getSurvey, isRelevant} = useForm();

  const survey = surveyFragment || getSurvey(formName);

  const renderAcknowledgeInput = (field) => {
    return (
      <Field
        as={AcknowledgeInput}
        name={field.name}
        onShowFieldInfo={showFieldInfo}
        label={field.label}
        key={field.name}
        setFieldValue={setFieldValue}
      />
    );
  };

  const renderDateInput = (field, isShowTimeOnly = false) => {
    return (
      <Field
        component={DateInputField}
        name={field.name}
        label={field.label}
        key={field.name}
        isShowTimeOnly={isShowTimeOnly}
        onMyChange={onMyChange}
      />
    );
  };

  const renderGroupHeading = (field) => {
    return (
      <SectionDivider dividerText={field.label}/>
    );
  };

  const renderTextInput = (field) => {
    return (
      <Field
        component={TextInputField}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        appearance={field.appearance}
        placeholder={field.hint}
        onMyChange={onMyChange}
        onShowFieldInfo={showFieldInfo}
        editable={getIsDisabled ? !getIsDisabled(field.name) : true}
        autoFocus={field.name === 'name'}
      />
    );
  };

  const renderNumberInput = (field) => {
    return (
      <Field
        component={NumberInputField}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        placeholder={field.hint}
        onMyChange={onMyChange}
        onShowFieldInfo={showFieldInfo}
      />
    );
  };

  const renderSelectInput = (field, isExpanded) => {
    const isDisabled = getIsDisabled ? getIsDisabled(field.name) : false;
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
        name={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        choices={fieldChoicesCopy}
        setFieldValue={setFieldValue}
        single={fieldType === 'select_one'}
        placeholder={field.hint}
        onShowFieldInfo={showFieldInfo}
        showExpandedChoices={isExpanded}
        errors={errors}
        onMyChange={onMyChange}
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

  const showFieldInfo = (label, info) => {
    if (label === 'Mineral Name Abbreviation') {
      info += '\n\n';
      const arr = Object.entries(LABELS_WITH_ABBREVIATIONS).map(([key, value]) => key + ': ' + value);
      info += arr.join('\n');
    }
    alert(label, info);
  };

  return (
    <FlatList
      listKey={JSON.stringify(survey)}
      keyExtractor={(item, index) => index.toString()}
      data={Object.values(survey.filter(item => isRelevant(item, values)))}
      renderItem={({item}) => renderField(item)}
      ItemSeparatorComponent={FlatListItemSeparator}
    />
  );
};

export default Form;
