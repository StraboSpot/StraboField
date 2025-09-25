import React, {useLayoutEffect, useRef, useState} from 'react';
import {Platform, ScrollView, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import NoteForm from './NoteForm';
import noteStyle from './notes.styles';
import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import SaveButton from '../../shared/ui/buttons/SaveButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import uiStyles from '../../shared/ui/ui.styles';
import {setLoadingStatus} from '../home/home.slice';
import useMapLocation from '../maps/useMapLocation';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import NotebookPageHeader from '../notebook-panel/NotebookPageHeader';
import {MODAL_KEYS, PAGE_KEYS, PRIMARY_PAGES} from '../page/page.constants';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedOrCreatedSpot, editedSpotProperties} from '../spots/spots.slice';
import Templates from '../templates/Templates';

const Notes = ({isReadOnly, zoomToCurrentLocation}) => {
  const dispatch = useDispatch();
  const initialNote = useSelector(state => state.spot.selectedSpot?.properties?.notes) || undefined;
  const modalVisible = useSelector(state => state.home.modalVisible);
  const spot = useSelector(state => state.spot.selectedSpot);
  const templates = useSelector(state => state.project.project?.templates) || {};

  const [initialNotesValues, setInitialNotesValues] = useState({note: initialNote});
  const [isShowTemplates, setIsShowTemplates] = useState(false);

  const toast = useToast();
  const {setPointAtCurrentLocation} = useMapLocation();

  const formRef = useRef(null);
  const page = PRIMARY_PAGES.find(p => p.key === PAGE_KEYS.NOTES);

  useLayoutEffect(() => {
    console.log('ULE Notes [templates]', templates);
    if (isEmpty(initialNote) && templates.notes && templates.notes.isInUse && !isEmpty(templates.notes.active)) {
      const templatesNotes = templates.notes.active.map(t => t.values.note).join('\n');
      setInitialNotesValues({note: templatesNotes});
    }
    return () => confirmLeavePage();
  }, [templates]);

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

  const renderCancelSaveButtons = () => {
    return (
      <View>
        <NotebookPageHeader hideBackButton={!isReadOnly} pageTitle={'Notes'}/>
        {!isReadOnly && <SaveAndCancelButtons cancel={cancelFormAndGo} save={saveFormAndGo}/>}
      </View>
    );
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

  const saveFormAndGo = async (currentForm = formRef.current) => {
    try {
      await saveForm(currentForm);
      if (zoomToCurrentLocation) await zoomToCurrentLocation();
      else dispatch(setNotebookPageVisible(PAGE_KEYS.OVERVIEW));
    }
    catch (e) {
      console.log('Error saving form data to Spot');
    }
  };

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
          <Templates
            isShowTemplates={isShowTemplates}
            page={page}
            setIsShowTemplates={bool => setIsShowTemplates(bool)}
          />
        </>
      ) : (
        <>
          {!isShowTemplates && renderCancelSaveButtons()}
          {!isReadOnly && (
            <Templates
              isShowTemplates={isShowTemplates}
              page={page}
              setIsShowTemplates={bool => setIsShowTemplates(bool)}
            />
          )}
        </>
      )}
      <FlatListItemSeparator/>
      {!isShowTemplates && (
        <ScrollView style={noteStyle.noteContainer}>
          <NoteForm
            formRef={formRef}
            initialNotesValues={initialNotesValues}
            isReadOnly={isReadOnly}
          />
          {modalVisible === MODAL_KEYS.SHORTCUTS.NOTE && (
            <SaveButton
              onPress={() => saveFormAndGo()}
              title={'Save Note'}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default Notes;
