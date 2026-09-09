import {ABBREVIATIONS_WITH_LABELS, LABELS_WITH_ABBREVIATIONS} from './minerals.constants';

export const chunk = (input, size) => {
  return input.reduce((arr, item, idx) => {
    return idx % size === 0 ? [...arr, [item]] : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
  }, []);
};

const getAbbrevFromFullMineralName = (name) => {
  const keyMatch = Object.keys(LABELS_WITH_ABBREVIATIONS).find(key => key.toLowerCase() === name.toLowerCase());
  if (keyMatch) return LABELS_WITH_ABBREVIATIONS[keyMatch].split(',')[0];
};

const getFullMineralNameFromAbbrev = abbrev => ABBREVIATIONS_WITH_LABELS[abbrev.toLowerCase()];

export const getMineralTitle = (item) => {
  if (item.full_mineral_name && item.mineral_abbrev) return item.full_mineral_name + ' (' + item.mineral_abbrev + ')';
  else if (item.full_mineral_name) return item.full_mineral_name;
  else if (item.mineral_abbrev) return '(' + item.mineral_abbrev + ')';
  else return 'Unknown';
};

export const setMineralFieldValue = async (formCurrent, name, value) => {
  console.log(name, 'changed to', value);
  if (name === 'mineral_abbrev') {
    const foundFullName = getFullMineralNameFromAbbrev(value);
    if (foundFullName) await formCurrent.setFieldValue('full_mineral_name', foundFullName);
    await formCurrent.setFieldValue('mineral_abbrev', value);
  }
  else if (name === 'full_mineral_name') {
    const foundAbbrev = getAbbrevFromFullMineralName(value);
    if (foundAbbrev) await formCurrent.setFieldValue('mineral_abbrev', foundAbbrev);
    await formCurrent.setFieldValue('full_mineral_name', value);
  }
  else await formCurrent.setFieldValue(name, value);
};
