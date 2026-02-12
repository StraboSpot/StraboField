import {useRef, useState} from 'react';

import {useDispatch, useSelector} from 'react-redux';

import {getNewUUID, isEmpty, isEqual} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import {MAIN_MENU_ITEMS, SIDE_PANEL_VIEWS} from '../main-menu-panel/mainMenu.constants';
import {setMenuSelectionPage, setSidePanelVisible} from '../main-menu-panel/mainMenuPanel.slice';
import {setSelectedTag, updatedProject} from '../project/projects.slice';

const useReportModal = ({openSpotInNotebook}) => {
  const dispatch = useDispatch();
  const report = useSelector(state => state.home.modalValues);
  const reports = useSelector(state => state.project.project?.reports) || [];

  const formRef = useRef(null);
  const {showErrors} = useForm();

  const reportImages = report?.images ? JSON.parse(JSON.stringify(report?.images)) : [];
  const [updatedImages, setUpdatedImages] = useState(reportImages);
  const reportSpots = report?.spots ? JSON.parse(JSON.stringify(report?.spots)) : [];
  const [checkedSpotsIds, setCheckedSpotsIds] = useState(reportSpots);
  const reportTags = report?.tags ? JSON.parse(JSON.stringify(report?.tags)) : [];
  const [checkedTagsIds, setCheckedTagsIds] = useState(reportTags);
  const initialValues = isEmpty(report) ? {} : report;

  const alertLeaveReport = (itemText, cont) => {
    alert(
      'Leave Report',
      'Are you sure you want to close this report and open the selected ' + itemText + '?',
      [{text: 'No', style: 'cancel'}, {text: 'Yes', onPress: cont}],
      {cancelable: false},
    );
  };

  const checkIsSafeDelete = () => {
    if (!isEmpty(updatedImages)) return 'Remove all images from this report before deleting.';
  };

  const checkReportChanged = (itemText, go) => {
    const isImageObjChanged = !isEqual(reportImages, updatedImages);
    const isSpotsObjChanged = !isEqual(reportSpots, checkedSpotsIds);
    const isTagsObjChanged = !isEqual(reportTags, checkedTagsIds);
    if ((formRef.current && formRef.current.dirty) || isImageObjChanged || isSpotsObjChanged || isTagsObjChanged) {
      const formCurrent = formRef?.current || {};
      alert(
        'Unsaved Changes',
        'Would you like to save your report before ' + (itemText ? 'navigating to this ' + itemText : 'continuing') + '?',
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

  const confirmCloseModal = () => checkReportChanged(null, closeModal);

  const deleteReport = () => {
    closeModal();
    const updatedReports = reports.filter(r => r.id !== report.id);
    dispatch(updatedProject({field: 'reports', value: updatedReports}));
  };

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
dispatch(
      setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.GEOLOGIC_UNITS}));
}
    else dispatch(setMenuSelectionPage({name: MAIN_MENU_ITEMS.PROJECT_DATA.TAGS}));
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

  const handleSpotPressedCont = spot => checkReportChanged('Spot', () => goToSpot(spot));

  const handleTagChecked = (tagId) => {
    console.log('Tag', tagId, checkedTagsIds);
    if (checkedTagsIds.find(id => id === tagId)) setCheckedTagsIds(checkedTagsIds.filter(id => id !== tagId));
    else setCheckedTagsIds([...checkedTagsIds, tagId]);
  };

  const handleTagPressed = tag => alertLeaveReport('Tag', () => handleTagPressedCont(tag));

  const handleTagPressedCont = tag => checkReportChanged('Tag', () => goToTag(tag));

  const saveReport = async () => {
    try {
      console.log('Saving report ...');
      await formRef.current.submitForm();
      let editedReport = showErrors(formRef.current);
      if (!editedReport.id) editedReport.id = getNewUUID();
      if (!editedReport.created_timestamp) editedReport.created_timestamp = Date.now();
      editedReport.updated_timestamp = Date.now();
      editedReport.images = updatedImages;
      editedReport.spots = checkedSpotsIds;
      editedReport.tags = checkedTagsIds;
      let updatedReports = reports.filter(r => r.id !== editedReport.id);
      updatedReports.push({...editedReport});
      dispatch(updatedProject({field: 'reports', value: updatedReports}));
    }
    catch (e) {
      console.log('Error saving report data', e);
    }
  };

  return {
    checkIsSafeDelete,
    checkedSpotsIds,
    checkedTagsIds,
    confirmCloseModal,
    deleteReport,
    formRef,
    handleSavePressed,
    handleSpotChecked,
    handleSpotPressed,
    handleTagChecked,
    handleTagPressed,
    initialValues,
    setUpdatedImages,
    updatedImages,
  };
};

export default useReportModal;
