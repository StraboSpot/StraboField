import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../services/device/useDevice';
import {csvToArray, getNewUUID, urlValidator} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import {addedStatusMessage, clearedStatusMessages, setLoadingStatus} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const useExternalData = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {pickCSV, readFile} = useDevice();
  const toast = useToast();

  /* Internal Functions */

  const createCSVObject = (CSVFile, data) => {
    const csvObject = {
      name: CSVFile.name.substring(0, CSVFile.name.lastIndexOf('.')),
      size: CSVFile.size,
      id: getNewUUID(),
      data: csvToArray(data),
    };
    console.log('CSV Object', csvObject);
    return csvObject;
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = event => resolve(event.target.result);
      fileReader.onerror = () => reject(fileReader.error);
      fileReader.readAsText(file);
    });
  };

  const saveCSV = (csvObject) => {
    try {
      let editedData = spot.properties.data ? JSON.parse(JSON.stringify(spot.properties.data)) : {};
      if (!editedData.tables) editedData.tables = [];
      editedData.tables.push(csvObject);
      console.log(editedData);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'data', value: editedData}));
    }
    catch (err) {
      console.error('Error saving .CSV file', err);
      toast.show('Error saving .CSV file', {type: 'warning', placement: 'top'});
    }
  };

  /* Exported Functions */

  const deleteCSV = (tableToDelete) => {
    const CSVcopy = JSON.parse(JSON.stringify(spot.properties.data.tables));
    console.log(CSVcopy);
    const filteredArr = CSVcopy.filter(table => table.id !== tableToDelete.id);
    console.log(filteredArr);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'data', value: {tables: filteredArr, urls: spot.properties.data.urls}}));
  };

  const deleteURL = (urlToDelete) => {
    const urlCopy = JSON.parse(JSON.stringify(spot.properties.data.urls));
    console.log(urlCopy);
    const filteredArr = urlCopy.filter(url => url !== urlToDelete);
    console.log(filteredArr);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'data', value: {urls: filteredArr, tables: spot.properties.data.tables}}));
  };

  const readCSV = async (dataFile) => {
    let CSVFile = {};
    let CSVData = '';
    try {
      dispatch(setLoadingStatus({view: 'home', bool: true}));

      if (Platform.OS !== 'web') {
        CSVFile = await pickCSV();
        // Check if user canceled the picker
        if (!CSVFile) {
          console.log('User canceled file selection');
          dispatch(setLoadingStatus({view: 'home', bool: false}));
          return;
        }
        console.log({uri: CSVFile.uri, type: CSVFile.type, name: CSVFile.name, size: CSVFile.size});
        CSVData = await readFile(CSVFile.uri);
      }
      else if (dataFile) {
        CSVFile = dataFile;
        CSVData = await readFileAsText(dataFile);
      }

      if (CSVData) {
        const csvObj = createCSVObject(CSVFile, CSVData);
        saveCSV(csvObj);
        console.log('.CSV saved successfully!');
        dispatch(setLoadingStatus({view: 'home', bool: false}));
      }
    }
    catch (err) {
      console.error(`Error reading .CSV file "${CSVFile?.name || 'unknown'}"`, err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
    }
  };

  const saveEdits = (urlToEdit) => {
    let editedData = spot.properties.data ? JSON.parse(JSON.stringify(spot.properties.data)) : {};
    const urlArrCopy = editedData.urls;
    urlArrCopy.splice(urlToEdit.index, 1, urlToEdit.url);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'data', value: editedData}));
  };

  const saveURL = (protocol, url) => {
    let savedUrls;
    const fullURL = (protocol + url).toLowerCase();
    console.log(fullURL);
    let editedData = spot.properties.data ? JSON.parse(JSON.stringify(spot.properties.data)) : {};
    if (spot.properties.data?.urls) savedUrls = spot.properties.data.urls;
    const valid = urlValidator(fullURL.toLowerCase());
    if (valid) {
      if (!savedUrls?.includes(fullURL)) {
        if (!editedData?.urls) editedData.urls = [];
        editedData.urls.push(fullURL.toLowerCase());
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'data', value: editedData}));
      }
      else {
        dispatch(clearedStatusMessages());
        dispatch(addedStatusMessage('URL is already in list.'));
        alert('URL is already in list.');
      }
    }
    else throw Error(`"${fullURL}" is not a valid URL.`);
  };

  return {
    deleteCSV,
    deleteURL,
    readCSV,
    saveEdits,
    saveURL,
  };
};

export default useExternalData;
