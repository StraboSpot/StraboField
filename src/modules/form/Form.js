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
                // Called for number fields in place of onMyChange, which every other field type gets too. A form
                // that only needs its numeric fields intercepted passes this instead, so its other fields keep
                // whatever the default path writes for them
                onNumberChange,
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

  // A subkey'd form edits one nested object, e.g. associated_orientation[0], so relevance, defaults and clearing
  // all read that object rather than the values around it
  const formValues = subkey ? values?.[subkey]?.[0] || {} : values;
  const survey = surveyFragment || getSurvey(formName);
  const relevantFields = survey.filter(item => isRelevant(item, formValues));

  /* Side Effects */

  useEffect(() => {
    // Set default values
    relevantFields.forEach((field) => {
      const [fieldType, choicesListName] = field.type.split(' ');
      if (fieldType === 'select_one' || fieldType === 'select_multiple') {
        const choiceValues = getChoices(formName).filter(c => c.list_name === choicesListName).map(c => c.name);
        if (isEmpty(formValues[field.name]) && field.default && choiceValues.includes(field.default)) {
          setFieldValue(getFieldPath(field.name), field.default, false);
        }
      }
    });
  }, []);

  /* Event Handlers */

  // A caller's onMyChange takes over writing the chosen value, so the clearing that SelectInputField's own write
  // would have done has to happen here instead. Without it a form wired through onMyChange keeps the fields its
  // new choice makes irrelevant and saves them with the feature
  const handleSelectChange = (name, value) => {
    clearFieldsMadeIrrelevant(getFieldName(name), value);
    onMyChange(name, value);
  };

  const handleShowFieldInfo = (label, info) => setFieldInfo({label, info});

  /* Logic Helpers */

  // Clear the fields that setting the named field to the given value makes irrelevant
  const clearFieldsMadeIrrelevant = (fieldName, value) => {
    let newValues = {...formValues, [fieldName]: value};

    // Iteratively clear fields that now have values but are no longer relevant
    let changed = true;
    while (changed) {
      changed = false;
      survey.forEach((field) => {
        if (field.name !== fieldName && newValues[field.name] !== undefined && !isRelevant(field, newValues)) {
          newValues = {...newValues, [field.name]: undefined};
          changed = true;
        }
      });
    }

    // Apply clears for fields that became irrelevant
    survey.forEach((field) => {
      if (field.name !== fieldName && formValues[field.name] !== undefined && newValues[field.name] === undefined) {
        setFieldValue(getFieldPath(field.name), undefined, false);
      }
    });
  };

  // Formik names a subkey'd field by its path; the survey and formValues key it by its bare name
  const getFieldName = path => subkey ? path.split('[0].')[1] : path;

  const getFieldPath = name => subkey ? subkey + '[0].' + name : name;

  // Wrap setFieldValue to also clear fields that become irrelevant after a change
  const setFieldValueAndClearIrrelevant = (path, value, shouldValidate) => {
    clearFieldsMadeIrrelevant(getFieldName(path), value);
    setFieldValue(path, value, shouldValidate);
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
        key={getFieldPath(field.name)}
        label={field.label}
        name={getFieldPath(field.name)}
        onMyChange={onNumberChange || onMyChange}
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
        key={getFieldPath(field.name)}
        label={field.label}
        name={getFieldPath(field.name)}
        onMyChange={onMyChange && handleSelectChange}
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
        key={getFieldPath(field.name)}
        label={field.label}
        name={getFieldPath(field.name)}
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
