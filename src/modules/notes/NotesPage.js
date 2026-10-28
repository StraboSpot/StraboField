import React, {useContext, useLayoutEffect, useRef, useState} from 'react';
import {Platform, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import NoteForm from './NoteForm';
import {isEmpty} from '../../shared/helpers';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import uiStyles from '../../shared/ui/ui.styles';
import {setActiveModal, setLoadingStatus} from '../home/home.slice';
import useMapLocation from '../maps/view/useMapLocation';
import {LeavePageContext, useUnsavedFormChanges} from '../notebook-panel/LeavePageContext';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {PRIMARY_PAGES} from '../page/page.constants';
import PageHeader from '../page/PageHeader';
import {PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot, editedSpotProperties} from '../spots/spots.slice';
import {getActiveTemplateList, getIsTemplateInUse} from '../templates/templates.helpers';
import TemplatesPicker from '../templates/TemplatesPicker';

const NotesPage = ({isReadOnly, openSpotInNotebook, registerSave, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const initialNote = useSelector(state => state.spot.selectedSpot?.properties?.notes) || undefined;
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};
  const {goToNotebookPage} = useContext(LeavePageContext);

  const {setPointAtCurrentLocation} = useMapLocation();
  const toast = useToast();

  // The shortcut note (see isShortcutNote) is a modal that makes a new Spot, so it has no page to leave. A save that
  // fails has said why and leaves the note unsaved, which is what tells the gate it did not go through.
  const formRef = useRef(null);
  const {hasUnsavedChanges, markSaved, setIsFormDirty} = useUnsavedFormChanges({
    formRef: formRef,
    getMessage: () => 'Your note hasn\'t been saved.',
    isAsking: !registerSave,
    save: async () => {
      await saveForm(formRef.current);
      return !hasUnsavedChanges();
    },
  });

  /* Local State */

  const [initialNotesValues, setInitialNotesValues] = useState({note: initialNote});
  const [isShowTemplates, setIsShowTemplates] = useState(false);

  /* Derived Variables */

  const page = PRIMARY_PAGES.find(p => p.key === PAGE_KEYS.NOTES);
  // The Shortcut Notes modal is the only caller that supplies a save ref: it renders the sticky Save button in
  // its footer and expects the note field to fill the body. It is also the only Notes that makes a new Spot, so
  // this - not activeModal - is what tells the two apart. The Notebook's own Notes page can be open at the same
  // time as the shortcut modal, and keying off activeModal had it creating Spots and skipping its own prompt.
  const isShortcutNote = !!registerSave;

  /* Side Effects */

  // The note is watched alongside the Spot's id because a shortcut note lands on the Spot after it is selected:
  // the Spot is created and selected first, then the note written into it, so the id alone never sees the note
  // arrive and the page would hold the blank values it initialized with.
  useLayoutEffect(() => {
    console.log('ULE NotesPage [templates, selectedSpot id, initialNote]', templates);
    const activeNoteTemplates = getActiveTemplateList(templates, PAGE_KEYS.NOTES);
    if (!isReadOnly && isEmpty(initialNote) && getIsTemplateInUse(templates, PAGE_KEYS.NOTES)
      && !isEmpty(activeNoteTemplates)) {
      const templatesNotes = activeNoteTemplates.map(t => t.values.note).join('\n');
      setInitialNotesValues({note: templatesNotes});
    }
    else {
      setInitialNotesValues({note: initialNote});
    }
  }, [templates, spot?.properties?.id, initialNote]);

  /* Logic Helpers */

  const cancelFormAndGo = () => goToNotebookPage(PAGE_KEYS.OVERVIEW);

  // Returns the Spot a shortcut note created, for the caller to show; editing an existing Spot returns undefined.
  const saveForm = async (currentForm) => {
    let createdSpot;
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));
      if (isShortcutNote) {
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
        createdSpot = pointSetAtCurrentLocation;
      }
      else {
        await currentForm.submitForm();
        const spotId = spot.properties.id;
        dispatch(updatedModifiedTimestampsBySpotsIds([spotId]));
        dispatch(editedSpotProperties({field: 'notes', value: currentForm.values.note, spotId: spotId}));
        markSaved();
        await currentForm.resetForm();
      }
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      // A shortcut note toasts from saveFormAndGo instead, once the modal is gone and the zoom has finished -
      // both of which would otherwise cover it
      if (Platform.OS !== 'web' && !isShortcutNote) toast.show('Notes Saved', {type: 'success'});
    }
    catch (err) {
      console.error('Error submitting form', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
    return createdSpot;
  };

  const saveFormAndGo = async (currentForm) => {
    try {
      // A Spot coming back means the shortcut save worked. Show it and let the shortcut go - nothing else closes
      // it - then zoom, and only then say so: the modal and the zoom's full-screen spinner would each paint over
      // the toast.
      const createdSpot = await saveForm(currentForm);
      if (createdSpot) {
        openSpotInNotebook(createdSpot, PAGE_KEYS.NOTES);
        dispatch(setActiveModal({modal: null}));
        await zoomToCurrentLocation();
        if (Platform.OS !== 'web') toast.show('Notes Saved', {type: 'success'});
      }
      else dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (err) {
      console.error('Error saving form data to Spot');
    }
  };

  // Expose the save action to a parent-owned sticky footer button (see NotesShortcutModal).
  if (registerSave) registerSave.current = () => saveFormAndGo(formRef.current);

  /* Render Functions */

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <PageHeader hideBackButton={!isReadOnly} pageTitle={page.label}/>
        {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} save={() => saveFormAndGo(formRef.current)}/>}
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {isShortcutNote ? (
        <>
          <View style={uiStyles.alignItemsToCenter}>
            <Text>Saving a note will create</Text>
            <Text>a new spot.</Text>
          </View>
          <TemplatesPicker
            isShowTemplates={isShowTemplates}
            page={page}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
          />
        </>
      ) : (
        <>
          {renderCancelSaveButtons()}
          {!isReadOnly && (
            <TemplatesPicker
              isShowTemplates={isShowTemplates}
              page={page}
              setIsShowTemplates={bool => setIsShowTemplates(bool)}
            />
          )}
        </>
      )}
      <FlatListItemSeparator/>
      {/* Stays mounted while the Notes Template modal is open over it, so what was typed is kept */}
      <NoteForm
        formRef={formRef}
        initialNotesValues={initialNotesValues}
        isFillHeight={isShortcutNote}
        isReadOnly={isReadOnly}
        setIsFormDirty={setIsFormDirty}
      />
    </View>
  );
};

export default NotesPage;
