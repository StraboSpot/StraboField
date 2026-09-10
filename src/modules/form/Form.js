import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';

import AcknowledgeInput from './AcknowledgeInput';
import FieldInfoModal from './FieldInfoModal';
import styles from './form.styles';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import {DateInputField, NumberInputField, SelectInputField, TextInputField, useForm} from '../form';

const Form = ({
                fieldCustomHeights,
                getIsDisabled,
                errors,
                formName,
                isReadOnly,
                onMyChange,
                renderInline,
                setFieldValue,
                subkey,
                surveyFragment,
                values,
              }) => {
  /* Data Hooks */

  const {getChoices, getSurvey, isRelevant} = useForm();

  /* Local State */

  const [fieldInfo, setFieldInfo] = useState(null);

  /* Derived Variables */

  const survey = surveyFragment || getSurvey(formName);
  const relevantFields = Object.values(survey.filter(item => isRelevant(item, values)));

  /* Side Effects */

  useEffect(() => {
    // Set default values
    survey.filter(item => isRelevant(item, values)).forEach((field) => {
      const [fieldType, choicesListName] = field.type.split(' ');
      if (fieldType === 'select_one' || fieldType === 'select_multiple') {
        const choiceValues = getChoices(formName).filter(c => c.list_name === choicesListName).map(c => c.name);
        if (isEmpty(values[field.name]) && field.default && choiceValues.includes(field.default)) {
          setFieldValue(field.name, field.default, false);
        }
      }
    });
  }, []);

  /* Event Handlers */

  const handleShowFieldInfo = (label, info) => setFieldInfo({label, info});

  /* Logic Helpers */

  // Wrap setFieldValue to also clear fields that become irrelevant after a change
  const setFieldValueAndClearIrrelevant = (name, value, shouldValidate) => {
    let newValues = {...values, [name]: value};

    // Iteratively clear fields that now have values but are no longer relevant
    let changed = true;
    while (changed) {
      changed = false;
      survey.forEach((field) => {
        if (field.name !== name && newValues[field.name] !== undefined && !isRelevant(field, newValues)) {
          newValues = {...newValues, [field.name]: undefined};
          changed = true;
        }
      });
    }

    // Apply clears for fields that became irrelevant
    survey.forEach((field) => {
      if (field.name !== name && values[field.name] !== undefined && newValues[field.name] === undefined) {
        setFieldValue(field.name, undefined, false);
      }
    });

    setFieldValue(name, value, shouldValidate);
  };

  /* Render Functions */

  const renderAcknowledgeInput = (field) => {
    return (
      <Field
        as={AcknowledgeInput}
        disabled={isReadOnly}
        key={field.name}
        label={field.label}
        name={field.name}
        onShowFieldInfo={handleShowFieldInfo}
        placeholder={field.hint}
        setFieldValue={setFieldValueAndClearIrrelevant}
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
        setFieldValue={setFieldValueAndClearIrrelevant}
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
          || fieldType === 'acknowledge' || fieldType === 'note') && (
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
                {fieldType === 'note' && renderNote(field)}
              </ListItem.Content>
            </ListItem>
          </>
        )}
      </>
    );
  };

  const renderFields = () => relevantFields.map((field, index) => (
    <React.Fragment key={field.name || field.label || index.toString()}>
      {renderField(field)}
    </React.Fragment>
  ));

  const renderGroupHeading = field => <SectionDivider dividerText={field.label}/>;

  const renderNote = field => <Text style={styles.noteTextItalic}>{field.label}</Text>;

  const renderNumberInput = (field) => {
    return (
      <Field
        component={NumberInputField}
        editable={!isReadOnly}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        onMyChange={onMyChange}
        onShowFieldInfo={handleShowFieldInfo}
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

    return (
      <Field
        appearance={field.appearance}
        as={SelectInputField}
        choices={fieldChoicesCopy}
        errors={errors}
        isReadOnly={isReadOnly}
        key={subkey ? subkey + '[0].' + field.name : field.name}
        label={field.label}
        name={subkey ? subkey + '[0].' + field.name : field.name}
        onMyChange={onMyChange}
        onShowFieldInfo={handleShowFieldInfo}
        placeholder={field.hint}
        setFieldValue={setFieldValueAndClearIrrelevant}
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
        onShowFieldInfo={handleShowFieldInfo}
        placeholder={field.hint}
      />
    );
  };

  /* View */

  // Render fields inline (no internal FlatList) on web, or when the caller already provides a single
  // scroll container. Nesting this FlatList inside another scroll view breaks iOS keyboard-focus
  // scrolling — the focused input's nearest scroll ancestor differs from the one adjusting insets.
  return (
    <>
      {Platform.OS === 'web' || renderInline ? renderFields() : (
        <FlatList
          data={relevantFields}
          keyExtractor={(item, index) => index.toString()}
          listKey={JSON.stringify(survey)}
          renderItem={({item}) => renderField(item)}
        />
      )}

      {/* Modal */}
      <FieldInfoModal fieldInfo={fieldInfo} onClose={() => setFieldInfo(null)}/>
    </>
  );
};

export default Form;
