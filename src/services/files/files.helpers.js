export const getImageIds = (images) => {
  const imageIds = [];
  images.forEach(image => imageIds.push(image.id));
  console.log(imageIds);
  return imageIds;
};
