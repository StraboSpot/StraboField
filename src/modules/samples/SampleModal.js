import React, {useState} from 'react';
import {FlatList, Text} from 'react-native';

import Toast from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import SampleModalForm from './SampleModalForm';
import SampleModalGeologicUnits from './SampleModalGeologicUnits';
import SampleModalImages from './SampleModalImages';
import useSampleModal from './useSampleModal';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import {WarningModal} from '../../shared/ui/modals';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {setModalVisible} from '../home/home.slice';

const SampleModal = ({onPress, zoomToCurrentLocation}) => {
  const dispatch = useDispatch();

  const [choicesViewKey, setChoicesViewKey] = useState(null);
  const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);

  const {
    checkedTagsIds,
    confirmCloseModal,
    currentForm,
    formRef,
    handleTagChecked,
    isLoading,
    namePostfix,
    namePrefix,
    sampleImages,
    saveSample,
    setSampleImages,
    startingNumber,
    toastRef,
  } = useSampleModal({setIsWarningModalVisible, zoomToCurrentLocation});

  const onCloseModalPressed = () => choicesViewKey ? setChoicesViewKey(null) : confirmCloseModal();

  return (
    <ModalWrapper
      buttonTitleRight={choicesViewKey ? 'Done' : null}
      closeModal={onCloseModalPressed}
      onFooterButtonPress={onPress}
      overlayStyleOverride={{height: '80%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <FlatList
        ListHeaderComponent={
          <>
            <SampleModalForm
              choicesViewKey={choicesViewKey}
              formRef={formRef}
              namePostfix={namePostfix}
              namePrefix={namePrefix}
              setChoicesViewKey={setChoicesViewKey}
              startingNumber={startingNumber}
            />
            {!choicesViewKey && (
              <>
                <SampleModalImages sampleImages={sampleImages} setSampleImages={setSampleImages}/>
                <SampleModalGeologicUnits checkedTagsIds={checkedTagsIds} handleTagChecked={handleTagChecked}/>
              </>
            )}
          </>
        }
        bounces={false}
      />
      {!choicesViewKey && <ActionButton isLoading={isLoading} onPress={() => saveSample(formRef.current)}/>}

      {SMALL_SCREEN && <Toast ref={toastRef}/>}

      {/* Secondary Modal */}
      <WarningModal
        cancelTitle={'No'}
        closeModal={() => setIsWarningModalVisible(false)}
        confirmText={'Save Changes'}
        isVisible={isWarningModalVisible}
        onCancelPress={() => dispatch(setModalVisible({modal: null}))}
        onConfirmPress={() => saveSample(currentForm)}
        showCloseButton
        title={'Unsaved Changes'}
      >
        <Text style={{flexWrap: 'wrap'}}>Would you like to save your sample before continuing?</Text>
      </WarningModal>
    </ModalWrapper>
  );
};

export default SampleModal;
