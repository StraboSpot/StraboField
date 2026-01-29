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
import {MODAL_KEYS, PAGE_KEYS} from '../page/page.constants';
import {useTags} from '../tags';

const TagDetailModal = ({closeModal}) => {
  const dispatch = useDispatch();
  const addTagToSelectedSpot = useSelector(state => state.project.addTagToSelectedSpot);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedTag = useSelector(state => state.project.selectedTag);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {deleteTag, saveTag} = useTags();
  const {validateForm, showErrors} = useForm();

  const formRef = useRef(null);

  let formName = ['project', 'tags'];
  let initialValues;
  if (modalVisible) {
    let tagType = 'concept';
    if (modalVisible === MODAL_KEYS.NOTEBOOK.GEOLOGIC_UNITS || modalVisible === MODAL_KEYS.SHORTCUTS.GEOLOGIC_UNITS) {
      tagType = PAGE_KEYS.GEOLOGIC_UNITS;
      formName = ['project', 'geologic_unit'];
    }
    initialValues = {type: tagType};
  }
  else if (!isEmpty(selectedTag)) {
    if (selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS) formName = ['project', 'geologic_unit'];
    initialValues = selectedTag;
  }
  else console.error('Tag Problem. No modals and no selected tag');

  const confirmDeleteTag = () => {
    alert(
      'Delete Tag',
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

  return (
    <ModalWrapper
      overlayStyleOverride={{height: 'auto'}}
      backdropStyle={{backgroundColor: 'rgba(0,0,0,0.5)'}}
      headerTitle={'Create New Tag'}
      onActionPressed={saveFormAndClose}
      onCancelPress={closeModal}
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
                  initialValues={initialValues}
                  innerRef={formRef}
                  onSubmit={() => console.log('Submitting form...')}
                  validate={values => validateForm({formName: formName, values: values})}
                />
              </View>
              {isEmpty(modalVisible) && <DeleteButton onPress={confirmDeleteTag} title={'Delete Tag'}/>}
            </>
          }
        />
      </>
    </ModalWrapper>
  );
};

export default TagDetailModal;
