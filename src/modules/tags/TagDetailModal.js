import React, {useRef} from 'react';
import {FlatList, View} from 'react-native';

import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {TAG_FORM_NAMES, TAG_TYPES} from './tags.constants';
import {getNewId, isEmpty, toTitleCase} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {useTags} from '../tags';
import TagColor from './color/TagColor';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';

let formName = TAG_FORM_NAMES.TAGS;
let initialValues;

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

  if (modalVisible) {
    let tagType = TAG_TYPES.CONCEPT;
    if (modalVisible === MODAL_KEYS.NOTEBOOK.GEOLOGIC_UNITS || modalVisible === MODAL_KEYS.SHORTCUTS.GEOLOGIC_UNITS) {
      tagType = PAGE_KEYS.GEOLOGIC_UNITS;
      formName = TAG_FORM_NAMES.GEOLOGIC_UNIT;
    }
    initialValues = {type: tagType};
  }
  else if (!isEmpty(selectedTag)) {
    formName = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? TAG_FORM_NAMES.GEOLOGIC_UNIT : TAG_FORM_NAMES.TAGS;
    initialValues = selectedTag;
  }
  else console.error('Tag Problem. No modals and no selected tag');
  const label = selectedTag.type === PAGE_KEYS.GEOLOGIC_UNITS ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS
    : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;
  const modalHeight = selectedTag?.type === PAGE_KEYS.GEOLOGIC_UNITS ? '80%' : 475;

  /* Logic Helpers */

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

  /* View */

  return (
    <ModalWrapper
      headerTitle={`${toTitleCase(label).slice(0, -1)} Info`}
      onActionPressed={saveFormAndClose}
      onCancelPress={closeModal}
      overlayStyleOverride={{flex: 1, maxHeight: modalHeight}}
    >
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
            <TagColor/>
            {isEmpty(modalVisible) && <DeleteButton onPress={confirmDeleteTag} title={'Delete Tag'}/>}
          </>
        }
      />
    </ModalWrapper>
  );
};

export default TagDetailModal;
