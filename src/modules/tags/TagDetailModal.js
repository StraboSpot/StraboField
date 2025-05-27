import React, {useRef} from 'react';
import {FlatList, View} from 'react-native';

import {Button, Overlay} from '@rn-vui/base';
import {Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty} from '../../shared/Helpers';
import * as themes from '../../shared/styles.constants';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/SaveAndCancelButtons';
import {useWindowSize} from '../../shared/ui/useWindowSize';
import {Form, useForm} from '../form';
import overlayStyles from '../home/overlays/overlay.styles';
import {setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {MODAL_KEYS, PAGE_KEYS} from '../page/page.constants';
import {useTags} from '../tags';

const TagDetailModal = ({closeModal}) => {
  const {height} = useWindowSize();

  const formRef = useRef(null);

  const dispatch = useDispatch();
  const addTagToSelectedSpot = useSelector(state => state.project.addTagToSelectedSpot);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedTag = useSelector(state => state.project.selectedTag);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);
  const {deleteTag, saveTag} = useTags();
  const {validateForm, showErrors} = useForm();

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
  else console.error('Tag Problem. No modal and no selected tag');

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

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <SaveAndCancelButtons
          cancel={() => closeModal()}
          save={() => saveFormAndClose()}
        />
      </View>
    );
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
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      isVisible
      overlayStyle={SMALL_SCREEN ? overlayStyles.overlayContainerFullScreen
        : {...overlayStyles.overlayContainer, maxHeight: height * 0.80}}
      fullScreen={SMALL_SCREEN}
      animationType={'slide'}
    >
      <>
        {renderCancelSaveButtons()}
        <FlatList
          ListHeaderComponent={
            <>
              <View style={{flex: 1}}>
                <Formik
                  innerRef={formRef}
                  onSubmit={() => console.log('Submitting form...')}
                  validate={values => validateForm({formName: formName, values: values})}
                  component={formProps => Form({formName: formName, ...formProps})}
                  initialValues={initialValues}
                  initialStatus={{formName: formName}}
                  enableReinitialize={true}
                />
              </View>
              {isEmpty(modalVisible) && (
                <Button
                  titleStyle={{color: themes.RED}}
                  title={'Delete Tag'}
                  type={'clear'}
                  onPress={() => confirmDeleteTag()}
                />
              )}
            </>
          }
        />
      </>
    </Overlay>
  );
};

export default TagDetailModal;
