import {isEmpty} from '../../shared/helpers';

// Compiled skip-logic and required-logic functions, keyed by the XLSForm string they came from. The strings are
// fixed by the survey JSON — 548 distinct ones across every form — so this is bounded and never needs clearing.
const compiledLogic = new Map();

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

  const minInclusive = field.constraint.match(/>=\s(-?\d*)/i);
  const minExclusive = minInclusive ? null : field.constraint.match(/>\s(-?\d*)/i);
  if (minInclusive || minExclusive) {
    const min = parseFloat((minInclusive || minExclusive)[1]);
    const isWithinMin = minInclusive ? value >= min : value > min;
    if (!isEmpty(min) && !isWithinMin) error = field.constraint_message || 'Value below min of ' + min;
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

export const isRequired = (field, values) => {
  if (field.required === 'true' || field.required === true) return true;
  else if (field.required === 'false' || field.required === false || isEmpty(field.required)) return false;
  else return getLogicFunction(field.required)(values);
};
