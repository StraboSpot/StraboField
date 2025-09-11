import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import DeleteConformationDialogBox from '../../shared/ui/modals/DeleteConformationDialogBox';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';

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
        actionTitle={isEmpty(initialValues) ? 'Add' : 'Update'}
        buttonTitleRight={'Close'}
        closeModal={confirmCloseModal}
        onActionPressed={handleSavePressed}
        onCancelPress={confirmCloseModal}
        onDeletePress={handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
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

        <DeleteConformationDialogBox
          isVisible={isDeleteReportModalVisible}
          onActionPressed={deleteReport}
          onCancelPress={() => setIsDeleteReportModalVisible(false)}
          showActionButton={isDeleteReportModalVisible && !errorMessage}
        >
          {errorMessage ? <Text>Unable to delete report.{'\n'}{errorMessage}</Text>
            : <Text>Are you sure you want to delete this report?</Text>}
        </DeleteConformationDialogBox>
      </ModalWrapper>

    </>
  );
};

export default ReportModal;
