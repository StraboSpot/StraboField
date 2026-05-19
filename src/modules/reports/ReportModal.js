import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/helpers';
import {WarningModal} from '../../shared/ui/modals';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const ReportModal = ({openSpotInNotebook, updateSpotsInMapExtent}) => {
  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);

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

  /* Derived Variables */

  const isNewReport = isEmpty(initialValues);

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteReportModalVisible, setIsDeleteReportModalVisible] = useState(false);

  /* Event Handlers */

  const handleDeletePressed = () => {
    setErrorMessage(checkIsSafeDelete());
    setIsDeleteReportModalVisible(true);
  };

  /* View */

  return (
    <>
      <ModalWrapper
        actionTitle={isNewReport ? 'Save' : 'Update'}
        closeModal={confirmCloseModal}
        headerTitle={isReadOnlyProject ? 'View Report' : isNewReport ? 'Create New Report' : 'Edit Report'}
        onActionPressed={handleSavePressed}
        onDeletePress={handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
        showActionButton={!isReadOnlyProject}
        showCancelButton={false}
        showCloseButton
        showDeleteButton={!isNewReport && !isReadOnlyProject}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <ReportForm initialValues={initialValues} isReadOnly={isReadOnlyProject} ref={formRef}/>
              <ReportImages
                isReadOnly={isReadOnlyProject}
                setUpdatedImages={setUpdatedImages}
                updatedImages={updatedImages}
              />
              <View style={{paddingTop: 10}}/>
              <ReportSpots
                checkedSpotsIds={checkedSpotsIds}
                handleSpotChecked={handleSpotChecked}
                handleSpotPressed={handleSpotPressed}
                isReadOnly={isReadOnlyProject}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
              <View style={{paddingTop: 10}}/>
              <ReportTags
                checkedTagsIds={checkedTagsIds}
                handleTagChecked={handleTagChecked}
                handleTagPressed={handleTagPressed}
                isReadOnly={isReadOnlyProject}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
            </>
          }
          bounces={false}
        />

        {/* Modal */}
        <WarningModal
          cancelTitle={errorMessage ? 'Ok' : 'Cancel'}
          isVisible={isDeleteReportModalVisible}
          onCancelPress={() => setIsDeleteReportModalVisible(false)}
          onConfirmPress={deleteReport}
          overlayStyleOverride={{height: '30%'}}
          showCancelButton={true}
          showConfirmButton={isDeleteReportModalVisible && !errorMessage}
          title={'Delete Report?'}
        >
          {errorMessage ? <Text>Unable to delete report.{'\n'}{errorMessage}</Text>
            : <Text>Are you sure you want to delete this report?</Text>}
        </WarningModal>
      </ModalWrapper>

    </>
  );
};

export default ReportModal;
