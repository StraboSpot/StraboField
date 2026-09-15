import {isEmpty} from '../../shared/helpers';

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

export const isRequired = (field, values) => {
  if (field.required === 'true' || field.required === true) return true;
  else if (field.required === 'false' || field.required === false || isEmpty(field.required)) return false;
  else {
    const requiredLogicJS = convertXLSFormLogicToJS(field.required);
    // console.log(field.name, 'required:', requiredLogicJS);

    const F = new Function('values', 'return ' + requiredLogicJS); // eslint-disable-line no-new-func
    return F(values);
  }
};
