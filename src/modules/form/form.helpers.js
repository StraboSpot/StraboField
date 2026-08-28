import {isEmpty} from '../../shared/helpers';

// Compiled skip-logic and required-logic functions, keyed by the XLSForm string they came from. The strings are
// fixed by the survey JSON — 548 distinct ones across every form — so this is bounded and never needs clearing.
const compiledLogic = new Map();

/* Internal Functions */

// The lowest value an XLSForm constraint string allows, and whether that bound is inclusive, or undefined where it
// sets no minimum. The inclusive form is matched first and the exclusive form only if there is none, since '>='
// also contains '>'.
const getConstraintMinimum = (constraint) => {
  const inclusiveMatch = constraint.match(/>=\s(-?\d*)/i);
  const exclusiveMatch = inclusiveMatch ? null : constraint.match(/>\s(-?\d*)/i);
  const match = inclusiveMatch || exclusiveMatch;
  return match && {isInclusive: !!inclusiveMatch, min: parseFloat(match[1])};
};

/* Exported Functions */

export const convertXLSFormLogicToJS = (logic) => {
  logic = logic.replace(/not/g, '!');
  logic = logic.replace(/selected\(\${(.*?)}, /g, 'values?.$1?.includes(');
  logic = logic.replace(/\$/g, '');
  logic = logic.replace(/{/g, 'values?.');
  logic = logic.replace(/}/g, '');
  logic = logic.replace(/''/g, 'undefined');
  logic = logic.replace(/ = /g, ' == ');
  logic = logic.replace(/ or /g, ' || ');
  logic = logic.replace(/ and /g, ' && ');
  return logic;
};

// Check a value against an XLSForm constraint string such as '. >= 0 and . <= 360'. An inclusive bound is matched
// first and the exclusive form only if there is none, since '<=' also contains '<'. A failing minimum overwrites a
// failing maximum.
export const getConstraintError = (field, value) => {
  let error;
  if (!field.constraint) return error;

  const maxInclusive = field.constraint.match(/<=\s(-?\d*)/i);
  const maxExclusive = maxInclusive ? null : field.constraint.match(/<\s(-?\d*)/i);
  if (maxInclusive || maxExclusive) {
    const max = parseFloat((maxInclusive || maxExclusive)[1]);
    const isWithinMax = maxInclusive ? value <= max : value < max;
    if (!isEmpty(max) && !isWithinMax) error = field.constraint_message || 'Value over max of ' + max;
  }

  const minimum = getConstraintMinimum(field.constraint);
  if (minimum) {
    const isWithinMin = minimum.isInclusive ? value >= minimum.min : value > minimum.min;
    if (!isEmpty(minimum.min) && !isWithinMin) {
      error = field.constraint_message || 'Value below min of ' + minimum.min;
    }
  }

  return error;
};

// Compile an XLSForm logic string into a function of the form's values, reusing the compiled one if it has been
// seen before. Validating a form asks whether each field is relevant twice, so without this a single save of a
// large survey compiles the same few hundred strings over and over.
export const getLogicFunction = (logic) => {
  let evaluate = compiledLogic.get(logic);
  if (!evaluate) {
    // eslint-disable-next-line no-new-func -- required for dynamic evaluation of XLSForm logic strings
    evaluate = new Function('values', 'return ' + convertXLSFormLogicToJS(logic));
    compiledLogic.set(logic, evaluate);
  }
  return evaluate;
};

// Whether a field's survey leaves room for a negative value. Only a constraint can rule one out, by setting a
// minimum of 0 or more; a field with no constraint has to be assumed to take them. Written as !(min >= 0) rather
// than min < 0 so that a minimum which did not parse falls the same permissive way.
export const isNegativeAllowed = (field) => {
  const minimum = field.constraint && getConstraintMinimum(field.constraint);
  return !minimum || !(minimum.min >= 0);
};

export const isRequired = (field, values) => {
  if (field.required === 'true' || field.required === true) return true;
  else if (field.required === 'false' || field.required === false || isEmpty(field.required)) return false;
  else return getLogicFunction(field.required)(values);
};
