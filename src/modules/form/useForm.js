import moment from 'moment';

import {convertXLSFormLogicToJS, isRequired} from './form.helpers';
import * as forms from '../../assets/forms';
import {isEmpty} from '../../shared/helpers';
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
    //console.log('values', values);
    if (isEmpty(field.relevant)) return true;
    const relevantLogicJS = convertXLSFormLogicToJS(field.relevant);
    // console.log(field.name, 'relevant:', relevantLogicJS);

    // eslint-disable-next-line no-new-func -- required for dynamic evaluation of XLSForm logic strings
    const F = new Function('values', 'return ' + relevantLogicJS);
    return F(values);
  };

  // Remove errors from data, if any, and show alert. Throw error if not leaving page.
  const showErrors = (form, isLeavingPage) => {
    let formValues = {...form.values};
    const errors = form.errors;
    const formName = form.status?.formName || [];
    if (hasErrors(form)) {
      const errorMessages = Object.entries(errors).map(([key, value]) => {
        if (form.initialValues[key]) formValues[key] = form.initialValues[key];
        else delete formValues[key];
        return getLabel(key, formName) + ': ' + value;
      });
      alert('Error Saving', 'Errors found in following fields. Unable to save these changes.'
        + ' Please fix the following errors.\n\n' + errorMessages.join('\n'));
      if (!isLeavingPage) throw Error('Found validation errors.');  // If we don't want user to leave the page throw Error
    }
    return formValues;
  };

  const validateForm = ({formName, values}) => {
    // console.log('Validating', formName, 'with', values);
    const errors = {};

    getSurvey(formName).forEach((fieldModel) => {
      const key = fieldModel.name;
      if (values[key] && typeof values[key] === 'string') values[key] = values[key].trim();
      if (isEmpty(values[key]) || !isRelevant(fieldModel, values)) delete values[key];
      if (isEmpty(values[key]) && isRelevant(fieldModel, values) && isRequired(fieldModel, values)) {
        errors[key] = 'Required';
      }
      else if (values[key]) {
        if (fieldModel.type === 'integer') {
          values[key] = isNaN(parseInt(values[key], 10)) ? undefined : parseInt(values[key], 10);
        }
        else if (fieldModel.type === 'decimal') {
          values[key] = isNaN(parseFloat(values[key])) ? undefined : parseFloat(values[key]);
        }
        if (key === 'end_date' && Date.parse(values.start_date) > Date.parse(values.end_date)) {
          errors[key] = fieldModel.constraint_message;
        }
        if (fieldModel.constraint) {
          // Max constraint
          // Look for <= in constraint, followed by a space and then any number of digits (- preceding the digits is optional)
          let regexMax = /<=\s(-?\d*)/i;
          let parsedMaxConstraint = fieldModel.constraint.match(regexMax);
          if (parsedMaxConstraint) {
            let max = parseFloat(parsedMaxConstraint[1]);
            if (!isEmpty(max) && !(values[key] <= max)) {
              errors[key] = fieldModel.constraint_message || 'Value over max of ' + max;
            }
          }
          else {
            // Look for < in constraint
            regexMax = /<\s(-?\d*)/i;
            parsedMaxConstraint = fieldModel.constraint.match(regexMax);
            if (parsedMaxConstraint) {
              let max = parseFloat(parsedMaxConstraint[1]);
              if (!isEmpty(max) && !(values[key] < max)) {
                errors[key] = fieldModel.constraint_message || 'Value over max of ' + max;
              }
            }
          }
          // Min constraint
          // Look for <= in constraint, followed by a space and then any number of digits (- preceding the digits is optional)
          let regexMin = />=\s(-?\d*)/i;
          let parsedMinConstraint = fieldModel.constraint.match(regexMin);
          if (parsedMinConstraint) {
            let min = parseFloat(parsedMinConstraint[1]);
            if (!isEmpty(min) && !(values[key] >= min)) {
              errors[key] = fieldModel.constraint_message || 'Value below min of ' + min;
            }
          }
          else {
            // Look for < in constraint
            regexMin = />\s(-?\d*)/i;
            parsedMinConstraint = fieldModel.constraint.match(regexMin);
            if (parsedMinConstraint) {
              let min = parseFloat(parsedMinConstraint[1]);
              if (!isEmpty(min) && !(values[key] > min)) {
                errors[key] = fieldModel.constraint_message || 'Value below min of ' + min;
              }
            }
          }
        }
      }
    });
    console.log('values after validation:', values, 'Errors:', errors);
    return errors;
  };

  return {
    getChoices,
    getChoicesByKey,
    getGroupFields,
    getLabel,
    getLabels,
    getRelevantFields,
    getSurvey,
    hasErrors,
    isRelevant,
    showErrors,
    validateForm,
  };
};

export default useForm;
