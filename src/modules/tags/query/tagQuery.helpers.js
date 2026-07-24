import {getTagTitle} from '../tags.helpers';
import {TAG_SORT_ORDER, TEMPORAL_FIELD_GROUPS, TEMPORAL_VALUE_RANGES} from './tagQuery.constants';

export const sortTagsAlphabetically = tagsToSort =>
  [...tagsToSort].sort((a, b) => getTagTitle(a).localeCompare(getTagTitle(b)));

export const sortTagsByDateCreated = tagsToSort =>
  [...tagsToSort].sort((a, b) => b.id - a.id);

// Fractions are measured from the old end (max) toward the young end (min):
// early = 1/4 through the period (close to old), late = 3/4 through (close to young)
const applyAgeModifier = (max, min, ageModifier) => {
  if (ageModifier === 'early') return max - 0.25 * (max - min);
  if (ageModifier === 'late') return max - 0.75 * (max - min);
  return (max + min) / 2;
};

const getAgeFromFieldGroup = (tag, fields) => {
  const modifiers = tag.age_modifier;
  const ageModifier = Array.isArray(modifiers) && modifiers.length === 1 ? modifiers[0] : modifiers;
  const ranges = fields.flatMap((field) => {
    const val = tag[field];
    if (!val || val.length === 0) return [];
    const values = Array.isArray(val) ? val : [val];
    return values.map(v => TEMPORAL_VALUE_RANGES[v]).filter(Boolean);
  });
  if (ranges.length === 0) return null;
  const spanMax = Math.max(...ranges.map(([max]) => max));
  const spanMin = Math.min(...ranges.map(([, min]) => min));
  return applyAgeModifier(spanMax, spanMin, ageModifier);
};

// Temporal age priority (Ma, smaller = younger):
// 1. absolute_age_of_geologic_unit
// 2. max/min_absolute_age_of_geol_unit (midpoint if both, otherwise whichever is set)
// 3–7. Named time period fields checked in group order: age → epoch → period → era → eon
//      All selected values in the matching group are combined into a single Ma span,
//      then age_modifier shifts the result: early=1/4 from old end, late=3/4, middle/none=midpoint
// Fallback: alphabetical (no date fields set)
const getTemporalAge = (tag) => {
  if (tag.absolute_age_of_geologic_unit != null) return tag.absolute_age_of_geologic_unit;
  const max = tag.max_absolute_age_of_geol_unit;
  const min = tag.min_absolute_age_of_geol_unit;
  if (max != null && min != null) return (max + min) / 2;
  if (max != null) return max;
  if (min != null) return min;
  for (const group of TEMPORAL_FIELD_GROUPS) {
    const result = getAgeFromFieldGroup(tag, group);
    if (result != null) return result;
  }
  return null;
};

export const sortTagsTemporally = (tagsToSort, reverse = false) => {
  const withAge = tagsToSort.filter(t => getTemporalAge(t) != null);
  const withoutAge = tagsToSort.filter(t => getTemporalAge(t) == null);
  const sortedWithAge = [...withAge].sort((a, b) => reverse
    ? getTemporalAge(b) - getTemporalAge(a)
    : getTemporalAge(a) - getTemporalAge(b));
  const sortedWithoutAge = [...withoutAge].sort((a, b) => reverse
    ? getTagTitle(b).localeCompare(getTagTitle(a))
    : getTagTitle(a).localeCompare(getTagTitle(b)));
  return [...sortedWithAge, ...sortedWithoutAge];
};

export const sortTagsByOrder = (tagsToSort, order, reverse = false) => {
  if (order === TAG_SORT_ORDER.TEMPORAL) return sortTagsTemporally(tagsToSort, reverse);
  const sorted = order === TAG_SORT_ORDER.DATE_CREATED ? sortTagsByDateCreated(tagsToSort)
    : sortTagsAlphabetically(tagsToSort);
  return reverse ? [...sorted].reverse() : sorted;
};
