import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useSamples from './useSamples';
import {getNewId, isEmpty, numToLetter, sleep, toError} from '../../shared/helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import useForm from '../form/useForm';
import {setActiveModal, setLoadingStatus} from '../home/home.slice';
import useMapLocation from '../maps/view/useMapLocation';
import {resolveLabelOnSave} from '../page/featureLabels.helpers';
import {MODAL_KEYS, PAGE_KEYS} from '../page/pageKeys.constants';
import {updatedProject} from '../project/projects.slice';
import useSpots from '../spots/useSpots';
import useTags from '../tags/useTags';

const useSampleModal = ({openSpotInNotebook, setIsWarningModalVisible, zoomToCurrentLocation}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const activeModal = useSelector(state => state.home.activeModal);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const spot = useSelector(state => state.spot.selectedSpot);

  const {getLabel, getLabels, submitAndShowErrors} = useForm();

  const {setPointAtCurrentLocation} = useMapLocation();
  const {createRichSample} = useSamples();
  const {checkSampleName, getNewSpotName} = useSpots();
  const {addSpotToTags} = useTags();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);
  const toastRef = useRef(null);

  const [checkedTagsIds, setCheckedTagsIds] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [namePostfix, setNamePostfix] = useState(null);

  const initialNamePrefix = preferences.sample_prefix || '';

  const [namePrefix, setNamePrefix] = useState(initialNamePrefix);
  const [sampleImages, setSampleImages] = useState([]);
  const [startingNumber, setStartingNumber] = useState(null);

  /* Side Effects */

  useLayoutEffect(() => {
    console.log('ULE SampleModal []');
    return () => confirmCloseModal();
  }, [spot]);

  useEffect(() => {
    console.log('UE SampleModal [spot]', spot);
    if (preferences.prepend_spot_name_sample_name && !spot.properties?.isSample) {
      const spotName = activeModal === MODAL_KEYS.SHORTCUTS.SAMPLE || !spot
        ? getNewSpotName()
        : spot?.properties?.name;
      setNamePrefix(spotName + initialNamePrefix);
    }

    if (preferences.sample_postfix_letter && !spot.properties?.isSample) {
      let postfixLetter = 'a';
      if (!isEmpty(spot?.properties?.samples)) {
        postfixLetter = numToLetter(spot.properties.samples.length + 1).toLowerCase();
      }
      setNamePostfix(postfixLetter);
    }
    else if (preferences.restart_sample_num_each_spot && !spot.properties?.isSample) {
      const count = spot?.properties?.samples?.length || 0;
      const postfixNumber = count + 1;
      setNamePostfix(postfixNumber < 10 ? '0' + postfixNumber : postfixNumber);
    }
    else {
      setStartingNumber(preferences.starting_sample_number || spot.properties?.samples?.length + 1 || 1);
    }
  }, [spot]);

  /* Internal Functions */

  const closeModal = () => dispatch(setActiveModal({modal: null}));

  /* Exported Functions */

  const confirmCloseModal = () => {
    if (formRef.current?.dirty && activeModal !== MODAL_KEYS.SHORTCUTS.SAMPLE) {
      setCurrentForm(formRef.current);
      setIsWarningModalVisible(true);
    }
    else closeModal();
  };

  const handleTagChecked = (tagId) => {
    console.log('Tag', tagId, checkedTagsIds);
    if (checkedTagsIds.find(id => id === tagId)) setCheckedTagsIds(checkedTagsIds.filter(id => id !== tagId));
    else setCheckedTagsIds([...checkedTagsIds, tagId]);
  };

  const saveSample = async (formRefCurrent) => {
    try {
      setIsLoading(true);
      dispatch(setLoadingStatus({bool: true, view: 'home'}));

      // The values the survey validates and cleans, rather than what is sitting in the inputs: numbers converted
      // from text, text trimmed, and the fields a choice has made irrelevant left out of the sample
      const {values} = await submitAndShowErrors(formRefCurrent);
      const sampleValues = resolveLabelOnSave(
        {pageKey: PAGE_KEYS.SAMPLES, values: values, getLabel: getLabel, getLabels: getLabels});
      const date = new Date().toISOString();
      const newId = getNewId();
      const newSample = {
        ...sampleValues,
        collection_date: date,
        collection_time: date,
        id: newId,
      };

      // Empty when createRichSample refused, having already said why, so nothing below may act as if it was saved
      let sampleSpot;
      if (activeModal === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        const pointSetAtCurrentLocation = await setPointAtCurrentLocation();
        pointSetAtCurrentLocation.properties.samples = [newSample];
        console.log('pointSetAtCurrentLocation', pointSetAtCurrentLocation);
        sampleSpot = createRichSample(pointSetAtCurrentLocation, newSample, sampleImages);
        setIsLoading(false);
        if (sampleSpot) openSpotInNotebook(sampleSpot, PAGE_KEYS.SAMPLES);
        closeModal();
        await zoomToCurrentLocation();
      }
      else {
        // Closed first so that a refusal's toast isn't hidden behind the modal. A refusal loses what was typed, which
        // is accepted as it should hardly ever happen: the ways into this modal are hidden for a read only Spot, and a
        // Spot in no dataset while there is no target to file the Sample in is rare.
        dispatch(setActiveModal({modal: null}));
        sampleSpot = createRichSample(spot, newSample, sampleImages);
        if (sampleSpot) {
          dispatch(updatedProject({
            field: 'preferences',
            value: {...preferences, starting_sample_number: namePostfix ? startingNumber : startingNumber + 1},
          }));
        }
        setIsLoading(false);
      }

      dispatch(setLoadingStatus({bool: false, view: 'home'}));
      await formRefCurrent.resetForm();
      if (!sampleSpot) return;

      // The app's own toast, after the modal has gone and any zoom has finished. The modal's Toast unmounts with it,
      // and is only ever mounted on a small screen, so it showed briefly or not at all.
      if (Platform.OS !== 'web') toast.show('Sample Saved!', {duration: 2000, placement: 'top', type: 'success'});
      if (!isEmpty(checkedTagsIds)) addSpotToTags(newId, checkedTagsIds);

      if (newSample.sample_id_name) {
        const foundDuplicateName = await checkSampleName(newSample.sample_id_name);
        if (foundDuplicateName) {
          await sleep(2000);
          const warningOptions = {duration: 2000, type: 'warning'};
          if (SMALL_SCREEN && toastRef) {
            toastRef.current?.show('Warning! Sample Name has Already Been Used.', warningOptions);
          }
          else toast.show('Warning! Sample Name has Already Been Used.', warningOptions);
          if (Platform.OS === 'web') await sleep(3000);
        }
      }
    }
    catch (err) {
      setIsLoading(false);
      console.error('Error saving Sample', err);
      dispatch(setLoadingStatus({bool: false, view: 'home'}));
      const errorMessage = `Error Saving Sample! \n${toError(err).message}`;
      const errorOptions = {duration: 2000, type: 'danger'};
      if (SMALL_SCREEN) toastRef.current?.show(errorMessage, errorOptions);
      else toast.show(errorMessage, errorOptions);
    }
  };

  return {
    checkedTagsIds,
    confirmCloseModal,
    currentForm,
    formRef,
    handleTagChecked,
    isLoading,
    namePostfix,
    namePrefix,
    sampleImages,
    saveSample,
    setSampleImages,
    startingNumber,
    toastRef,
  };
};

export default useSampleModal;
