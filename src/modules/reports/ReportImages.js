import React from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/Helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import {AddImageButtons, ImagesList, useImages} from '../images';
import {updatedProject} from '../project/projects.slice';

const ReportImages = ({setUpdatedImages, updatedImages}) => {
  const dispatch = useDispatch();
  const report = useSelector(state => state.home.modalValues);
  const reports = useSelector(state => state.project.project?.reports) || [];

  const {deleteImageFile} = useImages();

  const deleteImage = async (deletedImage) => {
    const imagesFiltered = updatedImages.filter(i => i.id !== deletedImage.id);
    if (report?.id) await deleteImageFromReport(deletedImage.id);
    setUpdatedImages(imagesFiltered);
    return true;
  };

  const deleteImageFromReport = async (imageId) => {
    const filteredImages = report.images.filter(i => i.id !== imageId);
    const editedReport = JSON.parse(JSON.stringify(report));
    editedReport.updated_timestamp = Date.now();
    if (isEmpty(filteredImages)) delete editedReport.images;
    else editedReport.images = filteredImages;
    let updatedReports = reports.filter(r => r.id !== editedReport.id);
    updatedReports.push({...editedReport});
    dispatch(updatedProject({field: 'reports', value: updatedReports}));
    await deleteImageFile(imageId);
  };

  const saveImagesToReport = (newImages) => {
    setUpdatedImages(prevState => ([...prevState, ...newImages]));
  };

  const saveUpdatedImage = (updatedImage) => {
    const imagesFiltered = updatedImages.filter(i => i.id !== updatedImage.id);
    setUpdatedImages([...imagesFiltered, updatedImage]);
  };

  return (
    <View>
      <SectionDivider dividerText={'Images'}/>
      <AddImageButtons saveImages={saveImagesToReport}/>
      <ImagesList
        deleteImage={deleteImage}
        images={updatedImages}
        isThumbnailOnly
        saveImages={saveImagesToReport}
        saveUpdatedImage={saveUpdatedImage}
      />
    </View>
  );

};

export default ReportImages;
