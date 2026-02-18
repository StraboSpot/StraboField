import React, {useRef} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {NOTEBOOK_PAGES} from '../page/page.constants';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {useTags} from '../tags';

const TagDetailModal = ({closeModal}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const addTagToSelectedSpot = useSelector(state => state.project.addTagToSelectedSpot);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {validateForm, showErrors} = useForm();
  const {deleteTag, saveTag} = useTags();

  /* Local State */

  const formRef = useRef(null);

  /* Derived Variables */

  const actionLabel = Object.keys(selectedTag)?.length > 1 ? 'Edit' : 'Create New';
  const tagType = selectedTag?.type === PAGE_KEYS.GEOLOGIC_UNITS ? PAGE_KEYS.GEOLOGIC_UNITS : PAGE_KEYS.TAGS;
  const formName = ['project', tagType];
  const label = NOTEBOOK_PAGES.find(p => p.key === tagType).label.slice(0, -1);
  const modalHeight = tagType === PAGE_KEYS.GEOLOGIC_UNITS ? '80%' : 475;

  /* Logic Helpers */

  const confirmDeleteTag = () => {
    alert(
      'Delete ' + label,
      'Are you sure you want to delete ' + selectedTag.name + '?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => doDeleteTag(),
        },
      ],
      {cancelable: false},
    );
  };

  const doDeleteTag = () => {
    closeModal();
    dispatch(setSidePanelVisible({bool: false}));
    deleteTag(selectedTag);
  };

  const saveFormAndClose = async () => {
    try {
      await formRef.current.submitForm();
      const formValues = showErrors(formRef.current);
      console.log('Saving tag data to Project ...', formValues);
      let updatedTag = formValues;
      if (!updatedTag.id) updatedTag.id = getNewId();
      if (addTagToSelectedSpot) {
        if (!updatedTag.spots) updatedTag.spots = [];
        updatedTag.spots.push(selectedSpot.properties.id);
      }
      closeModal();
      saveTag(updatedTag);
      console.log('Finished saving tag data');
    }
    catch (e) {
      console.log('Error saving tag data', e);
    }
  };

  /* View */

  return (
    <ModalWrapper
      headerTitle={actionLabel + ' ' + label}
      onActionPressed={saveFormAndClose}
      onCancelPress={closeModal}
      overlayStyleOverride={{flex: 1, maxHeight: modalHeight}}
    >
      <>
        <FlatList
          ListHeaderComponent={
            <>
              <View style={{flex: 1}}>
                <Formik
                  component={formProps => Form({formName: formName, ...formProps})}
                  enableReinitialize={true}
                  initialStatus={{formName: formName}}
                  initialValues={selectedTag}
                  innerRef={formRef}
                  onSubmit={() => console.log('Submitting form...')}
                  validate={values => validateForm({formName: formName, values: values})}
                />
              </View>
              {isEmpty(modalVisible) && <DeleteButton onPress={confirmDeleteTag} title={'Delete ' + label}/>}
            </>
          }
        />
      </>
    </ModalWrapper>
  );
};

export default TagDetailModal;
