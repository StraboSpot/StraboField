import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/Helpers';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import {WarningModal} from '../../shared/ui/modals';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import overlayStyles from '../../shared/ui/modals/overlay.styles';

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
        actionTitle={isEmpty(initialValues) ? 'Create New Report' : 'Update Report'}
        buttonTitleRight={'Close'}
        closeModal={confirmCloseModal}
        onActionPressed={handleSavePressed}
        onCancelPress={confirmCloseModal}
        onDeletePress={handleDeletePressed}
        overlayStyleOverride={{width: '80%'}}
        saveTitle={isEmpty(initialValues) ? 'Add' : 'Update'}
        shouldShowButtons
        showDeleteButton={!isEmpty(initialValues)}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <ReportForm initialValues={initialValues} ref={formRef}/>
              <FlatListItemSeparator/>
              <ReportImages setUpdatedImages={setUpdatedImages} updatedImages={updatedImages}/>
              <View style={{paddingTop: 10}}/>
              <FlatListItemSeparator/>
              <ReportSpots
                checkedSpotsIds={checkedSpotsIds}
                handleSpotChecked={handleSpotChecked}
                handleSpotPressed={handleSpotPressed}
                updateSpotsInMapExtent={updateSpotsInMapExtent}
              />
              <View style={{paddingTop: 10}}/>
              <FlatListItemSeparator/>
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
          closeModal={() => setIsDeleteReportModalVisible(false)}
          closeTitle={errorMessage ? 'Ok' : 'Cancel'}
          confirmText={'DELETE'}
          confirmTitleStyle={overlayStyles.importantText}
          isVisible={isDeleteReportModalVisible}
          onConfirmPress={deleteReport}
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
