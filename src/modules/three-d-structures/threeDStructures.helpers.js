import {toTitleCase} from '../../shared/helpers';

// getLabel is passed in because a plain helper cannot call useForm
export const getThreeDStructureTitle = (threeDStructure, getLabel) => {
  const firstClassTitle = toTitleCase(threeDStructure.type || '3D Structure');
  const secondClassTitle = getLabel(threeDStructure.feature_type || threeDStructure.fault_or_sz_type,
    ['_3d_structures', threeDStructure.type]).toUpperCase();
  return firstClassTitle + ' - ' + secondClassTitle;
};
