export const getPlanarTemplates = templatesToFilter => templatesToFilter.filter(
  t => t.values?.type === 'planar_orientation' || t.values?.type === 'tabular_orientation'
    || t.type === 'planar_orientation');

export const getLinearTemplates = templatesToFilter => templatesToFilter.filter(
  t => t.values?.type === 'linear_orientation' || t.type === 'linear_orientation');
