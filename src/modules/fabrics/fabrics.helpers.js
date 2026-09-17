import {ADD_FABRIC_FIELDS, DEFAULT_FABRIC_TYPE, DEPRECATED_FABRIC_TYPE} from './fabric.constants';
import {isEmpty, toTitleCase} from '../../shared/helpers';

// getLabel and getLabels are passed in because a plain helper cannot call useForm
export const getFabricTitle = (fabric, getLabel, getLabels) => {
  const {type} = fabric;
  if (type === DEPRECATED_FABRIC_TYPE) {
    return fabric.feature_type
      ? toTitleCase(getLabel(fabric.feature_type, ['_3d_structures', DEPRECATED_FABRIC_TYPE]))
      : 'Fabric';
  }
  const surveyPath = ['fabrics', type];
  const labelsArr = ADD_FABRIC_FIELDS[type]?.reduce((acc, fieldName) => {
    if (!fabric[fieldName]) return acc;
    const mainLabel = getLabel(fieldName, surveyPath);
    const choiceLabels = getLabels(fabric[fieldName], surveyPath);
    return [...acc, toTitleCase(mainLabel) + ' - ' + choiceLabels.toUpperCase()];
  }, []);
  if (isEmpty(labelsArr)) {
    return type === DEFAULT_FABRIC_TYPE ? 'Structural Fabric' : toTitleCase(getLabel(type, surveyPath));
  }
  return labelsArr.join(', ');
};
