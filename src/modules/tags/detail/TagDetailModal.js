import React, {useRef, useState} from 'react';
import {FlatList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, getTimestampFromId, isEmpty, toTitleCase} from '../../../shared/helpers';
import alert from '../../../shared/ui/alert';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import Form from '../../form/Form';
import FormikWrapper from '../../form/FormikWrapper';
import useForm from '../../form/useForm';
import {MAIN_MENU_ITEMS} from '../../main-menu-panel/mainMenu.constants';
import {setSidePanelVisible} from '../../main-menu-panel/mainMenuPanel.slice';
import TagColor from '../color/TagColor';
import {TAG_FORM_NAMES, TAG_TYPES} from '../tags.constants';
import useTags from '../useTags';

// Edits the tag it is given rather than selectedTag, so a tag created from a checklist leaves alone the one the tag
// side panel shows behind it. A new tag holds only its type; an existing one keeps its id, so saving edits it in place.
const TagDetailModal = ({closeModal, tag}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeModal = useSelector(state => state.home.activeModal);
  const addTagToSelectedSpot = useSelector(state => state.project.addTagToSelectedSpot);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {submitAndShowErrors} = useForm();
  const {deleteTag, saveTag} = useTags();

  /* Local State */

  const formRef = useRef(null);

  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [tempColor, setTempColor] = useState(tag.color);

  /* Derived Variables */

  const actionLabel = tag.id ? 'Edit' : 'Create New';
  const isGeologicUnit = tag.type === TAG_TYPES.GEOLOGIC_UNIT;
  const formName = isGeologicUnit ? TAG_FORM_NAMES.GEOLOGIC_UNIT : TAG_FORM_NAMES.TAGS;
  const label = isGeologicUnit ? MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS : MAIN_MENU_ITEMS.PROJECT_DATA.TAGS;
  const modalHeight = isGeologicUnit ? '80%' : 475;

  /* Logic Helpers */

  const confirmDeleteTag = () => {
    alert(
      'Delete ' + label,
      'Are you sure you want to delete ' + tag.name + '?',
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
    deleteTag(tag);
  };

  const saveFormAndClose = async () => {
    try {
      const {values: formValues} = await submitAndShowErrors(formRef.current);
      console.log('Saving tag data to Project ...', formValues);
      let updatedTag = formValues;
      if (!updatedTag.id) {
        updatedTag.id = getNewUUID();
        updatedTag.created_timestamp = Date.now();
      }
      // A tag made before created_timestamp existed has its creation time in its old numeric id
      else if (!updatedTag.created_timestamp) updatedTag.created_timestamp = getTimestampFromId(updatedTag.id);
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
      onActionPressed={saveFormAndClose}
      onCancelPress={closeModal}
      onDeletePress={confirmDeleteTag}
      overlayStyleOverride={{flex: 1, maxHeight: modalHeight}}
      showDeleteButton={isEmpty(activeModal) && !isEmpty(tag.id)}
    >
      <FlatList
        ListHeaderComponent={
          <>
            <TagColor onTempColorChange={setTempColor} tempColor={tempColor}/>
            <View style={{flex: 1}}>
              <FormikWrapper
                enableReinitialize={true}
                formName={formName}
                initialValues={tag}
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
