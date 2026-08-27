import moment from 'moment';

import {getConstraintError, getLogicFunction, isRequired} from './form.helpers';
import * as forms from '../../assets/forms';
import {isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {LABEL_DICTIONARY} from '../form';

const useForm = () => {
  /* Exported Functions */

  // Return the choices object given the form category and name
  const getChoices = ([category, name]) => {
    const choices = forms.default[category] && forms.default[category][name] && forms.default[category][name].choices || [];
    //console.log('Choices for form', category + '.' + name, ':', choices);
    return choices;
  };

  // Get the choices for a given key
  const getChoicesByKey = (survey, choices, key) => {
    const field = survey.find(f => f.name === key);
    if (field) {
      const choicesListName = field.type?.split(' ')[1];
      return choices.filter(choice => choice.list_name === choicesListName);
    }
    else return {};
  };

  // Get the fields relevant to a given group, including the group field itself
  const getGroupFields = (survey, groupKey) => {
    let inGroup = false;
    let relevantGroupFields = survey.reduce((acc, f) => {
      if (f.name === groupKey) inGroup = true;
      if (inGroup && f.type !== 'end_group') return [...acc, f];
      else if (f.type === 'end_group') inGroup = false;
      return acc;
    }, []);
    // console.log('Relevant Group Fields', relevantGroupFields);
    return relevantGroupFields;
  };

  // Get a label for a given key with the option of giving a form category, form name and field name
  const getLabel = (key, [category, name] = [], fieldName) => {
    if (key) {
      let dictionary = {};
      if (category && name) dictionary = LABEL_DICTIONARY[category][name];
      else if (category) {
        dictionary = Object.values(LABEL_DICTIONARY[category]).reduce((acc, form) => ({...acc, ...form}), {});
      }
      if (dictionary && dictionary[key.toString()]) return dictionary[key.toString()];
      else if (Date.parse(key) && new Date(key).toISOString() === key && fieldName?.includes('date')) {
        return moment(key).format('MM/DD/YYYY');
      }
      else if (Date.parse(key) && new Date(key).toISOString() === key && fieldName?.includes('time')) {
        return moment(key).format('h:mm:ss a');
      }
      else return key.toString().replace(/_/g, ' ');
    }
    else return 'Unknown';
  };

  // Get a labels as string for given keys with the option of giving a form category, form name and field name
  const getLabels = (keys, [category, name], fieldName) => {
    if (!Array.isArray(keys)) keys = [keys];
    const labelsArr = keys.map(val => getLabel(val, [category, name], fieldName));
    return labelsArr.join(', ');
  };

  // Get the fields relevant to a given field, meaning the field itself and any fields related by skip-logic
  const getRelevantFields = (survey, key) => {
    let relevantKeys = [key];
    let relevantFields = survey.reduce((acc, f) => {
      if (relevantKeys.includes(f.name) || !isEmpty(relevantKeys.filter(k => f.relevant?.includes('${' + k + '}')))) {
        relevantKeys = [...relevantKeys, f.name];
        return [...acc, f];
      }
      else return acc;
    }, []);
    // console.log('Relevant Fields', relevantFields);
    return relevantFields;
  };

  // The surveys of a tabbed record's other tabs - the part of the record the tab named here edits without showing
  const getSiblingSurvey = ([category, name], subpageKeys) => subpageKeys.filter(k => k !== name)
    .flatMap(k => getSurvey([category, k]));

  // Return the survey object given the form category and name
  const getSurvey = ([category, name]) => {
    const survey = forms.default[category] && forms.default[category][name] && forms.default[category][name].survey || [];
    //console.log('Survey for form', category + '.' + name, ':', survey);
    return survey;
  };

  const hasErrors = (formCurrent) => {
    return !isEmpty(formCurrent.errors);
  };

  // Determine if the field should be shown or not by looking at the relevant key-value pair
  const isRelevant = (field, values) => {
    if (isEmpty(field.relevant)) return true;
    return getLogicFunction(field.relevant)(values);
  };

  // Report the errors on a form and hand back the values a save should write: the failing fields rolled back to
  // what they were, the rest cleaned and kept. Throws when nothing should be saved at all, which is a value the
  // user has just typed and can still fix.
  const showErrors = (form, isLeavingPage) => {
    const errors = form.errors;
    const formName = form.status?.formName || [];
    // What a save writes is the cleaned values, not the text sitting in the fields
    let formValues = validateForm({formName: formName, values: form.values}).values;
    if (hasErrors(form)) {
      const errorMessages = Object.entries(errors).map(([key, value]) => {
        // A subkey'd field is keyed by its path, e.g. associated_orientation[0].plunge. Label it by both halves,
        // and skip the reversion below, which only reaches top-level fields.
        if (key.includes('[0].')) {
          const [subkey, fieldName] = key.split('[0].');
          return getLabel(subkey, formName) + ' ' + getLabel(fieldName, formName) + ': ' + value;
        }
        if (form.initialValues[key]) formValues[key] = form.initialValues[key];
        else delete formValues[key];
        return getLabel(key, formName) + ': ' + value;
      });
      // A value the user has just typed stops the save so they can fix it - the field is marked and, on most
      // forms, Save is held until it is. A value that was already wrong when the form opened is different: it is
      // not what they were doing, and refusing everything would leave a record that arrived with a bad value
      // impossible to edit at all, so it keeps its previous value and the rest of the form saves. Leaving the
      // page always takes that second path. A nested field is excluded from it because the roll-back above only
      // reaches the top level, so treating it as partial would write the bad value rather than hold it back.
      const isUnchangedBadValue = key => !key.includes('[0].')
        && isEqual(form.values[key], form.initialValues[key]);
      const isPartialSave = isLeavingPage || Object.keys(errors).every(isUnchangedBadValue);
      if (isPartialSave) {
        // Rolling those fields back can leave nothing else for this save to write, and a page can have saved
        // something of its own besides, so name what happened to these fields and claim nothing more than that
        const hasOtherChanges = !isEqual(formValues, form.initialValues);
        alert('Some Changes Not Saved', 'These fields have errors and were reset to their previous values.'
          + (hasOtherChanges ? ' Your other changes were saved.' : '') + '\n\n' + errorMessages.join('\n'));
      }
      else {
        alert('Error Saving', 'Errors found in the following fields. Your changes were not saved.'
          + ' Please fix them and try again.\n\n' + errorMessages.join('\n'));
      }
      if (!isPartialSave) throw Error('Found validation errors.');  // Stops the caller from saving anything
    }
    return formValues;
  };

  // Submit a form and report its errors the way showErrors does, returning both the errors and the values to save.
  // Formik rebinds innerRef on every commit, so the bag a save starts with is stale in two ways. Its errors are the
  // previous render's, which let a value typed and saved without leaving the field validate against errors from
  // before it was typed, so ask Formik for them directly. Its values are missing anything written in the same tick
  // as the save, as the compass does with its reading, so take a ref where the caller has one and re-read it after
  // submitting. Callers need the errors back because the isLeavingPage path alerts without throwing and saves the
  // valid fields, so only they can tell a whole save from a partial one.
  const submitAndShowErrors = async (formOrRef, isLeavingPage) => {
    const getForm = () => formOrRef.current || formOrRef;
    await getForm().submitForm();
    const form = getForm();
    const errors = await form.validateForm();
    return {errors: errors, values: showErrors({...form, errors: errors}, isLeavingPage)};
  };

  // Check the values against a form's survey, returning both the errors found and the values to save: strings
  // trimmed, numbers converted from the text they were typed as, and the fields left empty or made irrelevant by a
  // choice dropped. Nothing is written back into the values given, so a form can be validated while it is being
  // typed in without half-typed text being rewritten under the cursor - a decimal entered as '0.' would otherwise
  // become 0 before the digits after the point could be typed.
  // A survey given in place of a formName checks fields the form on screen does not show, which is how a tabbed
  // form checks the other tabs of the record it is one tab of.
  const validateForm = ({formName, survey, values}) => {
    const errors = {};
    const cleanedValues = {...values};

    (survey || getSurvey(formName)).forEach((fieldModel) => {
      const key = fieldModel.name;
      if (cleanedValues[key] && typeof cleanedValues[key] === 'string') cleanedValues[key] = cleanedValues[key].trim();
      if (isEmpty(cleanedValues[key]) || !isRelevant(fieldModel, cleanedValues)) delete cleanedValues[key];
      if (isEmpty(cleanedValues[key]) && isRelevant(fieldModel, cleanedValues)
        && isRequired(fieldModel, cleanedValues)) {
        errors[key] = 'Required';
      }
      // Checked with isEmpty rather than truthiness so a value of 0 still has its constraints applied
      else if (!isEmpty(cleanedValues[key])) {
        if (fieldModel.type === 'integer') {
          cleanedValues[key] = isNaN(parseInt(cleanedValues[key], 10)) ? undefined : parseInt(cleanedValues[key], 10);
        }
        else if (fieldModel.type === 'decimal') {
          cleanedValues[key] = isNaN(parseFloat(cleanedValues[key])) ? undefined : parseFloat(cleanedValues[key]);
        }
        // A date range in the wrong order is one mistake across two fields, so mark both rather than only the
        // one the survey happens to define it on - whichever of them was just edited has to be able to say so
        if (key === 'end_date' && Date.parse(cleanedValues.start_date) > Date.parse(cleanedValues.end_date)) {
          errors.start_date = fieldModel.constraint_message;
          errors[key] = fieldModel.constraint_message;
        }
        const constraintError = getConstraintError(fieldModel, cleanedValues[key]);
        if (constraintError) errors[key] = constraintError;
      }
    });
    return {errors: errors, values: cleanedValues};
  };

  return {
    getChoices,
    getChoicesByKey,
    getGroupFields,
    getLabel,
    getLabels,
    getRelevantFields,
    getSiblingSurvey,
    getSurvey,
    hasErrors,
    isRelevant,
    showErrors,
    submitAndShowErrors,
    validateForm,
  };
};

export default useForm;
