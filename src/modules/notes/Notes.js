import React, {useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import NoteForm from './NoteForm';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import uiStyles from '../../shared/ui/ui.styles';
import {setLoadingStatus} from '../home/home.slice';
import useMapLocation from '../maps/view/useMapLocation';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PRIMARY_PAGES} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot, editedSpotProperties} from '../spots/spots.slice';
import TemplatesNotebook from '../templates/TemplatesNotebook';

const Notes = ({isReadOnly, registerSave, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const initialNote = useSelector(state => state.spot.selectedSpot?.properties?.notes) || undefined;
  const modalVisible = useSelector(state => state.home.modalVisible);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const {setPointAtCurrentLocation} = useMapLocation();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  const [initialNotesValues, setInitialNotesValues] = useState({note: initialNote});
  const [isShowTemplates, setIsShowTemplates] = useState(false);

  /* Derived Variables */

  const page = PRIMARY_PAGES.find(p => p.key === PAGE_KEYS.NOTES);
  // When a parent supplies a save ref (the Shortcut Notes modal), it renders the sticky Save button
  // in its footer and expects the note field to fill the body, so we hide the inline Save button here.
  const isFillLayout = !!registerSave;

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE Notes [templates, selectedSpot]', templates);
    if (!isReadOnly && isEmpty(initialNote) && templates.notes && templates.notes.isInUse
      && !isEmpty(templates.notes.active)) {
      const templatesNotes = templates.notes.active.map(t => t.values.note).join('\n');
      setInitialNotesValues({note: templatesNotes});
    }
    else {
      setInitialNotesValues({note: initialNote});
    }
    return () => confirmLeavePage();
  }, [templates, spot?.properties?.id]);

  /* Logic Helpers */

  const cancelFormAndGo = () => {
    dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
  };

  const confirmLeavePage = () => {
    if (formRef.current && formRef.current.dirty && modalVisible !== MODAL_KEYS.SHORTCUTS.NOTE) {
      const formCurrent = formRef.current;
      alert('Unsaved Changes',
        'Would you like to save your data before continuing?',
        [{
          text: 'No',
          style: 'cancel',
        }, {
          text: 'Yes',
          onPress: () => saveFormAndGo(formCurrent),
        }],
        {cancelable: false},
      );
    }
  };

  const saveForm = async (currentForm) => {
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (modalVisible === MODAL_KEYS.SHORTCUTS.NOTE) {
        let pointSetAtCurrentLocation = await setPointAtCurrentLocation();
        pointSetAtCurrentLocation = {
          ...pointSetAtCurrentLocation,
          properties: {
            ...pointSetAtCurrentLocation.properties,
            notes: currentForm.values.note,
          },
        };
        console.log('pointSetAtCurrentLocation', pointSetAtCurrentLocation);
        dispatch(updatedModifiedTimestampsBySpotsIds([pointSetAtCurrentLocation.properties.id]));
        dispatch(editedOrCreatedSpot(pointSetAtCurrentLocation));
      }
      else {
        await currentForm.submitForm();
        const spotId = spot.properties.id;
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'notes', value: currentForm.values.note, spotId: spotId}));
        await currentForm.resetForm();
      }
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      if (Platform.OS !== 'web') toast.show('Notes Saved', {type: 'success'});
    }
    catch (err) {
      console.log('Error submitting form', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const saveFormAndGo = async (currentForm) => {
    try {
      await saveForm(currentForm);
      if (zoomToCurrentLocation) await zoomToCurrentLocation();
      else dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

  // Expose the save action to a parent-owned sticky footer button (see ShortcutNotesModal).
  if (registerSave) registerSave.current = () => saveFormAndGo(formRef.current);

  /* Render Functions */

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <PageHeader hideBackButton={!isReadOnly} pageTitle={'Notes'}/>
        {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} save={() => saveFormAndGo(formRef.current)}/>}
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {modalVisible === MODAL_KEYS.SHORTCUTS.NOTE ? (
        <>
          {!isShowTemplates && (
            <View style={uiStyles.alignItemsToCenter}>
              <Text>Saving a note will create</Text>
              <Text>a new spot.</Text>
            </View>
          )}
          <TemplatesNotebook
            isShowTemplates={isShowTemplates}
            page={page}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
          />
        </>
      ) : (
        <>
          {!isShowTemplates && renderCancelSaveButtons()}
          {!isReadOnly && (
            <TemplatesNotebook
              isShowTemplates={isShowTemplates}
              page={page}
              setIsShowTemplates={bool => setIsShowTemplates(bool)}
            />
          )}
        </>
      )}
      <FlatListItemSeparator/>
      {!isShowTemplates && (
        <>
          <NoteForm
            formRef={formRef}
            initialNotesValues={initialNotesValues}
            isFillHeight={isFillLayout}
            isReadOnly={isReadOnly}
          />
          {modalVisible === MODAL_KEYS.SHORTCUTS.NOTE && !isFillLayout
            && <ActionButton onPress={() => saveFormAndGo(formRef.current)}/>}
        </>
      )}
    </View>
  );
};

export default Notes;
