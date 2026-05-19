import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {isEmpty} from '../../shared/helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import {AddImageButtons, ImageModal, ImagesList, useImages} from '../images';
import {updatedProject} from '../project/projects.slice';

const ReportImages = ({isReadOnly, setUpdatedImages, updatedImages}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const report = useSelector(state => state.home.modalValues);
  const reports = useSelector(state => state.project.project?.reports) || [];

  const {deleteImageFile} = useImages();

  /* Local State */

  const [imageToView, setImageToView] = useState({});
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  /* Event Handlers */

  const handleOpenImage = (image) => {
    setImageToView(image);
    setIsImageModalVisible(true);
  };

  /* Logic Helpers */

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

  /* View */

  return (
    <View>
      <SectionDivider dividerText={'Images'}/>
      {!isReadOnly && <AddImageButtons saveImages={saveImagesToReport}/>}
      <ImagesList
        deleteImage={deleteImage}
        images={updatedImages}
        isThumbnailOnly
        onOpenImage={handleOpenImage}
      />

      {/* Modal */}
      <ImageModal
        deleteImage={deleteImage}
        image={imageToView}
        isVisible={isImageModalVisible}
        saveImages={saveImagesToReport}
        saveUpdatedImage={saveUpdatedImage}
        setImageToView={setImageToView}
        setIsImageModalVisible={setIsImageModalVisible}
      />
    </View>
  );

};

export default ReportImages;
