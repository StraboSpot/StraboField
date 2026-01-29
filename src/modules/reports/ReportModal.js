import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/Helpers';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {WarningModal} from '../../shared/ui/modals';

const ReportModal = ({openSpotInNotebook, updateSpotsInMapExtent}) => {

  const [isDeleteReportModalVisible, setIsDeleteReportModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    checkIsSafeDelete,
    checkedSpotsIds,
    checkedTagsIds,
    confirmCloseModal,
    deleteReport,
    formRef,
    handleSavePressed,
    handleSpotChecked,
    handleSpotPressed,
    handleTagChecked,
    handleTagPressed,
    initialValues,
    setUpdatedImages,
    updatedImages,
  } = useReportModal({openSpotInNotebook: openSpotInNotebook});

  const handleDeletePressed = () => {
    setErrorMessage(checkIsSafeDelete());
    setIsDeleteReportModalVisible(true);
  };

  return (
    <>
      <ModalWrapper
        actionTitle={isEmpty(initialValues) ? 'Save' : 'Update'}
        closeModal={confirmCloseModal}
        onActionPressed={handleSavePressed}
        onDeletePress={handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
        showCancelButton={false}
        showCloseButton
        showDeleteButton={!isEmpty(initialValues)}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <ReportForm initialValues={initialValues} ref={formRef}/>
              <ReportImages setUpdatedImages={setUpdatedImages} updatedImages={updatedImages}/>
              <View style={{paddingTop: 10}}/>
              <ReportSpots
                checkedSpotsIds={checkedSpotsIds}
                handleSpotChecked={handleSpotChecked}
                handleSpotPressed={handleSpotPressed}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
              <View style={{paddingTop: 10}}/>
              <ReportTags
                checkedTagsIds={checkedTagsIds}
                handleTagChecked={handleTagChecked}
                handleTagPressed={handleTagPressed}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
            </>
          }
          bounces={false}
        />
        <WarningModal
          cancelTitle={errorMessage ? 'Ok' : 'Cancel'}
          overlayStyleOverride={{height: '30%'}}
          title={'Delete Report?'}
          isVisible={isDeleteReportModalVisible}
          onConfirmPress={deleteReport}
          onCancelPress={() => setIsDeleteReportModalVisible(false)}
          showConfirmButton={isDeleteReportModalVisible && !errorMessage}
          showCancelButton={true}
        >
          {errorMessage ? <Text>Unable to delete report.{'\n'}{errorMessage}</Text>
            : <Text>Are you sure you want to delete this report?</Text>}
        </WarningModal>
      </ModalWrapper>

    </>
  );
};

export default ReportModal;
