import React, {useState} from 'react';
import {View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getUniqueTitle, isEmpty} from '../../shared/helpers';
import SectionDivider from '../../shared/ui/SectionDivider';
import {AddImageButtons, ImageModal, ImagesList, useImages} from '../images';
import {updatedProject} from '../project/projects.slice';
import SketchModal from '../sketch/SketchModal';

const ReportImages = ({isReadOnly, setUpdatedImages, updatedImages}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const report = useSelector(state => state.home.modalValues);
  const reports = useSelector(state => state.project.project?.reports) || [];

  const {deleteImageFile} = useImages();

  /* Local State */

  const [imageToView, setImageToView] = useState({});
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);
  const [sketchImage, setSketchImage] = useState({});

  /* Event Handlers */

  const handleOpenImage = (image) => {
    setImageToView(image);
    setIsImageModalVisible(true);
  };

  const handleOpenSketch = (image) => {
    setIsImageModalVisible(false);
    setSketchImage(image);
    setIsSketchModalVisible(true);
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

  // Report images skip editedSpotImages, so titles are made unique here instead
  const saveImagesToReport = (newImages) => {
    setUpdatedImages((prevState) => {
      const takenTitles = prevState.map(image => image.title).filter(title => !isEmpty(title));
      return [...prevState, ...newImages.map((image) => {
        if (isEmpty(image.title)) return image;
        const title = getUniqueTitle(image.title, takenTitles);
        takenTitles.push(title);
        return {...image, title: title};
      })];
    });
  };

  const saveUpdatedImage = (updatedImage) => {
    setUpdatedImages(prevState => prevState.map(i => i.id === updatedImage.id ? updatedImage : i));
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

      {/* Modals */}
      <ImageModal
        deleteImage={deleteImage}
        image={imageToView}
        isVisible={isImageModalVisible}
        onOpenSketch={handleOpenSketch}
        saveUpdatedImage={saveUpdatedImage}
        setImageToView={setImageToView}
        setIsImageModalVisible={setIsImageModalVisible}
      />
      {isSketchModalVisible && (
        <SketchModal
          image={sketchImage}
          saveImages={saveImagesToReport}
          saveUpdatedImage={saveUpdatedImage}
          setIsSketchModalVisible={setIsSketchModalVisible}
        />
      )}
    </View>
  );

};

export default ReportImages;
