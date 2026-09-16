// getLabels is passed in because a plain helper cannot call useForm.
export const getReactionTextureTitle = (item, getLabels) => {
  const formName = ['pet', 'reactions'];
  return (item.reactions || 'Unknown')
    + (item.based_on && (' - ' + getLabels(item.based_on, formName).toUpperCase()));
};
