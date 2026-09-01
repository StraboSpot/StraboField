import React, {useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {TAG_FORM_NAMES, TAG_TYPES} from './tags.constants';
import {getNewId, isEmpty, toTitleCase} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, FormikWrapper, useForm} from '../form';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {useTags} from '../tags';
import TagColor from './color/TagColor';
import {MAIN_MENU_ITEMS} from '../main-menu-panel/mainMenu.constants';

const TagDetailModal = ({closeModal}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {isReadOnly: isReadOnlyProject} = useSelector(state => state.project?.project);
  const addTagToSelectedSpot = useSelector(state => state.project.addTagToSelectedSpot);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const selectedTag = useSelector(state => state.project.selectedTag);

  const {submitAndShowErrors} = useForm();
  const {deleteTag, saveTag} = useTags();

  /* Local State */

  const formRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [tempColor, setTempColor] = useState(selectedTag?.color);

  /* Derived Variables */

  const actionLabel = Object.keys(selectedTag)?.length > 1 ? 'Edit' : 'Create New';
  // The modal key alone can't identify a geologic unit: the Add Sample modal hosts its own geologic units
  // section, so it opens this modal under the 'samples' key. The list that opens this modal always stamps the
  // type on selectedTag, so check that first and fall back to the geologic unit modal keys.
  const isGeologicUnit = selectedTag?.type === TAG_TYPES.GEOLOGIC_UNIT
    || modalVisible === MODAL_KEYS.NOTEBOOK.GEOLOGIC_UNITS
    || modalVisible === MODAL_KEYS.SHORTCUTS.GEOLOGIC_UNITS;

  let initialValues = {};
  let formName = TAG_FORM_NAMES.TAGS;
  if (modalVisible) {
    if (isGeologicUnit) formName = TAG_FORM_NAMES.GEOLOGIC_UNIT;
    initialValues = {type: isGeologicUnit ? TAG_TYPES.GEOLOGIC_UNIT : TAG_TYPES.CONCEPT};
  }
  else if (!isEmpty(selectedTag)) {
    formName = isGeologicUnit ? TAG_FORM_NAMES.GEOLOGIC_UNIT : TAG_FORM_NAMES.TAGS;
    initialValues = selectedTag;
  }
  else console.error('Tag Problem. No modals and no selected tag');
  const label = isGeologicUnit ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;
  const modalHeight = isGeologicUnit ? '80%' : 475;

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
      const {values: formValues} = await submitAndShowErrors(formRef.current);
      console.log('Saving tag data to Project ...', formValues);
      let updatedTag = formValues;
      if (!updatedTag.id) updatedTag.id = getNewId();
      if (tempColor) updatedTag.color = tempColor;
      else delete updatedTag.color;
      if (addTagToSelectedSpot) {
        if (!updatedTag.spots) updatedTag.spots = [];
        updatedTag.spots.push(selectedSpot.properties.id);
      }
      closeModal();
      saveTag(updatedTag);
      console.log('Finished saving tag data');
    }
    catch (err) {
      console.error('Error saving tag data', err);
    }
  };

  /* View */

  return (
    <ModalWrapper
      disabled={isFormInvalid}
      headerTitle={`${actionLabel} ${toTitleCase(label).slice(0, -1)}`}
      onActionPressed={isReadOnlyProject ? undefined : saveFormAndClose}
      onCancelPress={closeModal}
      onDeletePress={confirmDeleteTag}
      overlayStyleOverride={{flex: 1, maxHeight: modalHeight}}
      showDeleteButton={isEmpty(modalVisible) && !isEmpty(selectedTag?.id) && !isReadOnlyProject}
    >
      <FlatList
        ListHeaderComponent={
          <>
            <TagColor onTempColorChange={setTempColor} tempColor={tempColor}/>
            <View style={{flex: 1}}>
              <FormikWrapper
                enableReinitialize={true}
                formName={formName}
                initialValues={initialValues}
                innerRef={formRef}
                setIsFormInvalid={setIsFormInvalid}
              >
                {formProps => <Form {...formProps} formName={formName}/>}
              </FormikWrapper>
            </View>
          </>
        }
      />
    </ModalWrapper>
  );
};

export default TagDetailModal;
