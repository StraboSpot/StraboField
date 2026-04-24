import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {useSelector} from 'react-redux';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/Helpers';
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
        actionTitle={isEmpty(initialValues) ? 'Save' : 'Update'}
        closeModal={confirmCloseModal}
        onActionPressed={isReadOnlyProject ? undefined : handleSavePressed}
        onDeletePress={isReadOnlyProject ? undefined : handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
        showCancelButton={false}
        showCloseButton
        showDeleteButton={!isEmpty(initialValues) && !isReadOnlyProject}
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
