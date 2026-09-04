import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {ReportComments, ReportForm, ReportImages, ReportMetadata, ReportSpots, ReportTags, useReportModal} from '.';
import {WarningModal} from '../../shared/ui/modals';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

const ReportModal = ({openSpotInNotebook}) => {
  /* Data Hooks */

  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const {straboUserId} = useSelector(state => state.user);

  const {
    checkIsSafeDelete,
    checkedSpotsIds,
    checkedTagsIds,
    comments,
    confirmCloseModal,
    deleteReport,
    formRef,
    handleSaveComment,
    handleSavePressed,
    handleSpotChecked,
    handleSpotPressed,
    handleTagChecked,
    handleTagPressed,
    hasUnsavedChanges,
    initialValues,
    setIsFormDirty,
    setUpdatedImages,
    updatedImages,
  } = useReportModal({openSpotInNotebook: openSpotInNotebook});

  /* Local State */

  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleteReportModalVisible, setIsDeleteReportModalVisible] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Derived Variables */

  // A new memo can arrive with values already set (the Spot it was created from), so only a saved memo has an id
  const isNewReport = !initialValues.id;
  const isReadOnly = isReadOnlyProject || (initialValues?.straboUserId && initialValues.straboUserId !== straboUserId);

  /* Event Handlers */

  const handleDeletePressed = () => {
    setErrorMessage(checkIsSafeDelete());
    setIsDeleteReportModalVisible(true);
  };

  /* View */

  return (
    <>
      <ModalWrapper
        actionTitle={isNewReport ? 'Save' : hasUnsavedChanges ? 'Update' : 'Done'}
        closeModal={confirmCloseModal}
        disabled={isFormInvalid}
        headerTitle={isReadOnly ? 'View Memo' : isNewReport ? 'Create New Memo' : 'Update Memo'}
        onActionPressed={isNewReport || hasUnsavedChanges ? handleSavePressed : confirmCloseModal}
        onDeletePress={handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
        showActionButton={!isReadOnly}
        showCancelButton={false}
        showCloseButton
        showDeleteButton={!isNewReport && !isReadOnly}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <ReportForm initialValues={initialValues} ref={formRef} setIsFormInvalid={setIsFormInvalid}/>
              <ReportImages setUpdatedImages={setUpdatedImages} updatedImages={updatedImages}/>
              <ReportForm
                initialValues={initialValues}
                isReadOnly={isReadOnly}
                onDirtyChange={setIsFormDirty}
                ref={formRef}
              />
              {!isNewReport && (
                <ReportMetadata
                  createdBy={initialValues.created_by}
                  createdTimestamp={initialValues.created_timestamp}
                  updatedTimestamp={initialValues.updated_timestamp}
                />
              )}
              <ReportImages
                isReadOnly={isReadOnly}
                setUpdatedImages={setUpdatedImages}
                updatedImages={updatedImages}
              />
              <View style={{paddingTop: 10}}/>
              <ReportSpots
                checkedSpotsIds={checkedSpotsIds}
                handleSpotChecked={handleSpotChecked}
                handleSpotPressed={handleSpotPressed}
                isReadOnly={isReadOnly}
              />
              <View style={{paddingTop: 10}}/>
              <ReportTags
                checkedTagsIds={checkedTagsIds}
                handleTagChecked={handleTagChecked}
                handleTagPressed={handleTagPressed}
                isReadOnly={isReadOnly}
              />
              <View style={{paddingTop: 10}}/>
              <ReportComments
                comments={comments}
                isReadOnlyProject={isReadOnlyProject}
                onSaveComment={handleSaveComment}
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
          title={'Delete Memo?'}
        >
          {errorMessage ? <Text>Unable to delete memo.{'\n'}{errorMessage}</Text>
            : <Text>Are you sure you want to delete this memo?</Text>}
        </WarningModal>
      </ModalWrapper>

    </>
  );
};

export default ReportModal;
