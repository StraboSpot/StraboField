import {ABBREVIATIONS_WITH_LABELS, LABELS_WITH_ABBREVIATIONS} from './minerals.constants';

export const chunk = (input, size) => {
  return input.reduce((arr, item, idx) => {
    return idx % size === 0 ? [...arr, [item]] : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
  }, []);
};

export const getAbbrevFromFullMineralName = (name) => {
  const keyMatch = Object.keys(LABELS_WITH_ABBREVIATIONS).find(key => key.toLowerCase() === name.toLowerCase());
  if (keyMatch) return LABELS_WITH_ABBREVIATIONS[keyMatch].split(',')[0];
};

export const getFullMineralNameFromAbbrev = abbrev => ABBREVIATIONS_WITH_LABELS[abbrev.toLowerCase()];
