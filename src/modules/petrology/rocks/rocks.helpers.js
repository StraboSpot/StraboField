import {ROCK_FIRST_ORDER_CLASS_FIELDS} from './rocks.constants';
import {isEmpty, toTitleCase} from '../../../shared/helpers';

// Build a rock's title from whichever first-order class fields are filled in, falling back to the rock type's own
// label when none are. getLabel and getLabels are passed in because a plain helper cannot call useForm.
export const getPetRockTitle = (rock, type, getLabel, getLabels) => {
  const formName = type === 'igneous' ? ['pet', rock.igneous_rock_class] : ['pet', type];
  const labelsArr = ROCK_FIRST_ORDER_CLASS_FIELDS[type].reduce((acc, fieldName) => {
    if (rock[fieldName]) {
      const mainLabel = getLabel(fieldName, formName);
      const choiceLabels = getLabels(rock[fieldName], formName);
      return [...acc, toTitleCase(mainLabel) + ' - ' + choiceLabels.toUpperCase()];
    }
    else return acc;
  }, []);
  if (isEmpty(labelsArr)) {
    const defaultTitle = type === 'igneous' ? rock.igneous_rock_class
      : type === 'alteration_or' ? 'Alteration, Ore'
        : type;
    return toTitleCase(getLabel(defaultTitle + ' Rock', formName));
  }
  else return labelsArr.join(', ');
};
