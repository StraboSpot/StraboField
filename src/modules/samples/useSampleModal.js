import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useSamples from './useSamples';
import {getNewId, isEmpty, numToLetter, sleep} from '../../shared/Helpers';
import {SMALL_SCREEN} from '../../shared/styles.constants';
import {setLoadingStatus, setModalVisible} from '../home/home.slice';
import useMapLocation from '../maps/useMapLocation';
import {MODAL_KEYS} from '../page/pageKeys.constants';
import {updatedProject} from '../project/projects.slice';
import {useSpots} from '../spots';
import {useTags} from '../tags';

const useSampleModal = ({setIsWarningModalVisible, zoomToCurrentLocation}) => {
  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const preferences = useSelector(state => state.project.project?.preferences) || {};
  const spot = useSelector(state => state.spot.selectedSpot);

  const {createRichSample} = useSamples();
  const {checkSampleName, getNewSpotName} = useSpots();
  const {setPointAtCurrentLocation} = useMapLocation();
  const {addSpotToTags} = useTags();

  const toast = useToast();

  const formRef = useRef(null);
  const toastRef = useRef(null);

  const initialNamePrefix = preferences.sample_prefix || '';

  const [checkedTagsIds, setCheckedTagsIds] = useState([]);
  const [currentForm, setCurrentForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [namePostfix, setNamePostfix] = useState(null);
  const [namePrefix, setNamePrefix] = useState(initialNamePrefix);
  const [sampleImages, setSampleImages] = useState([]);
  const [startingNumber, setStartingNumber] = useState(null);

  useLayoutEffect(() => {
    console.log('ULE SampleModal []');
    return () => confirmCloseModal();
  }, [spot]);

  useEffect(() => {
    console.log('UE SampleModal [spot]', spot);
    if (preferences.prepend_spot_name_sample_name && !spot.properties?.isSample) {
      const spotName = modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE || !spot
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

  const closeModal = () => dispatch(setModalVisible({modal: null}));

  const confirmCloseModal = () => {
    if (formRef.current?.dirty && modalVisible !== MODAL_KEYS.SHORTCUTS.SAMPLE) {
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

      const date = new Date().toISOString();
      const newId = getNewId();
      const newSample = {
        ...formRefCurrent.values,
        collection_date: date,
        collection_time: date,
        id: newId,
      };

      if (modalVisible === MODAL_KEYS.SHORTCUTS.SAMPLE) {
        const pointSetAtCurrentLocation = await setPointAtCurrentLocation();
        pointSetAtCurrentLocation.properties.samples = [newSample];
        console.log('pointSetAtCurrentLocation', pointSetAtCurrentLocation);
        createRichSample(pointSetAtCurrentLocation, newSample, sampleImages);
        toastRef.current?.show('Sample Saved!', {duration: 2000, placement: 'top', type: 'success'});
        setIsLoading(false);
        await zoomToCurrentLocation();
      }
      else {
        dispatch(setModalVisible({modal: null}));
        createRichSample(spot, newSample, sampleImages);
        dispatch(updatedProject({
          field: 'preferences',
          value: {...preferences, starting_sample_number: namePostfix ? startingNumber : startingNumber + 1},
        }));
        toast.show('Sample Saved!', {duration: 2000, placement: 'top', type: 'success'});
        setIsLoading(false);
      }

      if (!isEmpty(checkedTagsIds)) addSpotToTags(newId, checkedTagsIds);

      dispatch(setLoadingStatus({bool: false, view: 'home'}));
      await formRefCurrent.resetForm();
      if (modalVisible !== MODAL_KEYS.SHORTCUTS.SAMPLE) closeModal();

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
      const errorOptions = {duration: 2000, type: 'danger'};
      if (SMALL_SCREEN) toastRef.current?.show(`Error Saving Sample! \n${err}`, errorOptions);
      else toast.show(`Error Saving Sample! \n${err}`, errorOptions);
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
