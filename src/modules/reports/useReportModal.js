import {useEffect, useRef, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {getNewId, isEmpty, isEqual} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {useForm} from '../form';
import {setModalValues, setModalVisible} from '../home/home.slice';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {setSelectedTag, updatedProject} from '../project/projects.slice';

const useReportModal = ({openSpotInNotebook}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const report = useSelector(state => state.home.modalValues);
  const reports = useSelector(state => state.project.project?.reports) || [];
  const {name: userName, straboUserId} = useSelector(state => state.user);

  const {showErrors} = useForm();

  /* Local State */

  const formRef = useRef(null);

  const reportSpots = report?.spots ? JSON.parse(JSON.stringify(report?.spots)) : [];
  const [checkedSpotsIds, setCheckedSpotsIds] = useState(reportSpots);

  const reportTags = report?.tags ? JSON.parse(JSON.stringify(report?.tags)) : [];
  const [checkedTagsIds, setCheckedTagsIds] = useState(reportTags);

  const reportImages = report?.images ? JSON.parse(JSON.stringify(report?.images)) : [];
  const [updatedImages, setUpdatedImages] = useState(reportImages);

  const reportComments = report?.comments ? JSON.parse(JSON.stringify(report?.comments)) : [];
  const [comments, setComments] = useState(reportComments);

  const [isFormDirty, setIsFormDirty] = useState(false);

  /* Derived Variables */

  const hasUnsavedChanges = isFormDirty
    || !isEqual(reportImages, updatedImages)
    || !isEqual(reportSpots, checkedSpotsIds)
    || !isEqual(reportTags, checkedTagsIds);

  const initialValues = isEmpty(report) ? {} : report;

  /* Side Effects */

  // Clear the values on the way out so the next memo doesn't open on top of this one's. The Memos page and this modal
  // share the 'reports' key, so leftover values would otherwise show a saved memo's title, buttons and checked Spots
  // when the modal reopens to create a new one.
  useEffect(() => {
    console.log('UE useReportModal []');
    return () => dispatch(setModalValues({}));
  }, []);

  /* Internal Functions */

  const alertLeaveReport = (itemText, cont) => {
    alert(
      'Leave Memo',
      'Are you sure you want to close this memo and open the selected ' + itemText + '?',
      [{text: 'No', style: 'cancel'}, {text: 'Yes', onPress: cont}],
      {cancelable: false},
    );
  };

  const checkReportChanged = (itemText, go) => {
    const isImageObjChanged = !isEqual(reportImages, updatedImages);
    const isSpotsObjChanged = !isEqual(reportSpots, checkedSpotsIds);
    const isTagsObjChanged = !isEqual(reportTags, checkedTagsIds);
    if (isFormDirty || isImageObjChanged || isSpotsObjChanged || isTagsObjChanged) {
      const formCurrent = formRef?.current || {};
      alert(
        'Unsaved Changes',
        'Would you like to save your memo before ' + (itemText ? 'navigating to this ' + itemText : 'continuing') + '?',
        [{
          text: 'No',
          style: 'cancel',
          onPress: go,
        },
          {
            text: 'Yes',
            onPress: async () => {
              await saveReport(formCurrent);
              go();
            },
          },
        ],
        {cancelable: false},
      );
    }
    else go();
  };

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const goToSpot = (spot) => {
    console.log('Going to Spot', spot);
    closeModal();
    openSpotInNotebook(spot);
  };

  const goToTag = (tag) => {
    closeModal();
    dispatch(setSidePanelVisible({bool: true, view: SIDE_PANEL_VIEWS.TAG_DETAIL}));
    dispatch(setSelectedTag(tag));
    if (tag.type === 'geologic_unit') {
      dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS}));
    }
    else dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.TAGS}));
  };

  const handleSpotPressedCont = spot => checkReportChanged('Spot', () => goToSpot(spot));

  const handleTagPressedCont = tag => checkReportChanged('Tag', () => goToTag(tag));

  const saveReport = async () => {
    try {
      console.log('Saving report ...');
      await formRef.current.submitForm();
      let editedReport = showErrors(formRef.current);
      if (!editedReport.id) editedReport.id = getNewId();
      if (!editedReport.straboUserId || !editedReport.created_by) {
        editedReport.straboUserId = straboUserId;
        editedReport.created_by = userName;
      }
      if (!editedReport.created_timestamp) editedReport.created_timestamp = Date.now();
      editedReport.updated_timestamp = Date.now();
      editedReport.comments = comments;
      editedReport.images = updatedImages;
      editedReport.spots = checkedSpotsIds;
      editedReport.tags = checkedTagsIds;
      let updatedReports = reports.filter(r => r.id !== editedReport.id);
      updatedReports.push({...editedReport});
      dispatch(updatedProject({field: 'reports', value: updatedReports}));
    }
    catch (err) {
      console.error('Error saving report data', err);
    }
  };

  /* Exported Functions */

  const checkIsSafeDelete = () => {
    if (!isEmpty(updatedImages)) return 'Remove all images from this memo before deleting.';
  };

  const confirmCloseModal = () => checkReportChanged(null, closeModal);

  const deleteReport = () => {
    closeModal();
    const updatedReports = reports.filter(r => r.id !== report.id);
    dispatch(updatedProject({field: 'reports', value: updatedReports}));
  };

  const handleSaveComment = (text) => {
    const newComment = {
      created_timestamp: Date.now(),
      id: getNewId(),
      name: userName,
      straboUserId: straboUserId,
      text: text,
    };
    const newComments = [...comments, newComment];
    setComments(newComments);
    if (report?.id) {
      const updatedReports = reports.map(
        r => r.id === report.id ? {...r, comments: newComments, updated_timestamp: Date.now()} : r);
      dispatch(updatedProject({field: 'reports', value: updatedReports}));
    }
  };

  const handleSavePressed = async () => {
    await saveReport();
    closeModal();
  };

  const handleSpotChecked = (spotId) => {
    console.log('Spot', spotId, checkedSpotsIds);
    if (checkedSpotsIds.find(id => id === spotId)) setCheckedSpotsIds(checkedSpotsIds.filter(id => id !== spotId));
    else setCheckedSpotsIds([...checkedSpotsIds, spotId]);
  };

  const handleSpotPressed = spot => alertLeaveReport('Spot', () => handleSpotPressedCont(spot));

  const handleTagChecked = (tagId) => {
    console.log('Tag', tagId, checkedTagsIds);
    if (checkedTagsIds.find(id => id === tagId)) setCheckedTagsIds(checkedTagsIds.filter(id => id !== tagId));
    else setCheckedTagsIds([...checkedTagsIds, tagId]);
  };

  const handleTagPressed = tag => alertLeaveReport('Tag', () => handleTagPressedCont(tag));

  return {
    checkedSpotsIds,
    checkedTagsIds,
    checkIsSafeDelete,
    comments,
    confirmCloseModal,
    deleteReport,
    formRef,
    handleSaveComment,
    handleSavePressed,
    handleSpotChecked,
    handleSpotPressed,
    handleTagChecked,
    handleTagPressed,
    hasUnsavedChanges,
    initialValues,
    setIsFormDirty,
    setUpdatedImages,
    updatedImages,
  };
};

export default useReportModal;
