import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Icon} from 'react-native-elements';

import {ReportForm, ReportImages, ReportSpots, ReportTags, useReportModal} from '.';
import {isEmpty} from '../../shared/Helpers';
import {RED} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import Modal from '../../shared/ui/modal/Modal';
import SaveButton from '../../shared/ui/SaveButton';
import {WarningModal} from '../home/modals';
import overlayStyles from '../home/overlays/overlay.styles';

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

      <Modal
        title={isEmpty(initialValues) ? 'Create New Report' : 'Update Report'}
        buttonTitleRight={'Close'}
        closeModal={confirmCloseModal}
      >
        <FlatList
          bounces={false}
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
        />
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View style={{width: 40}}/>
          <SaveButton title={'Save Report'} onPress={handleSavePressed}/>
          <Icon
            name={'trash'}
            type={'ionicon'}
            color={RED}
            onPress={handleDeletePressed}
            containerStyle={{padding: 10, alignSelf: 'flex-end'}}
          />
        </View>
      </Modal>

      <WarningModal
        title={'Delete Report?'}
        isVisible={isDeleteReportModalVisible}
        closeTitle={errorMessage ? 'Ok' : 'Cancel'}
        closeModal={() => setIsDeleteReportModalVisible(false)}
        showCancelButton={true}
        showConfirmButton={isDeleteReportModalVisible && !errorMessage}
        confirmText={'DELETE'}
        confirmTitleStyle={overlayStyles.importantText}
        onConfirmPress={deleteReport}
      >
        {errorMessage ? <Text>Unable to delete report.{'\n'}{errorMessage}</Text>
          : <Text>Are you sure you want to delete this report?</Text>}
      </WarningModal>

    </>
  );
};

export default ReportModal;
