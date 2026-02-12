import {Platform} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import useDevice from '../../services/useDevice';
import {csvToArray, getNewUUID, urlValidator} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import {addedStatusMessage, clearedStatusMessages, setLoadingStatus} from '../home/home.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const useExternalData = () => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);

  const {pickCSV, readFile} = useDevice();
  const toast = useToast();

  let csvObject = {};
  let CSVData = '';

  // INTERNAL
  const createCSVObject = (CSVFile, data) => {
    csvObject.name = CSVFile.name.substring(0, CSVFile.name.lastIndexOf('.'));
    csvObject.size = CSVFile.size;
    csvObject.id = getNewUUID();
    csvObject.data = csvToArray(data);
    console.log('CSV Object', csvObject);
    return csvObject;
  };

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
    try {
      let CSVFile = {};
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
      else {
        if (dataFile) {
          CSVFile = dataFile;
          const getCSVData = () => {
            return new Promise((resolve) => {
              const fileReader = new FileReader();

              fileReader.onload = async (event) => {
                const result = event.target.result;
                resolve(result);
              };

              fileReader.readAsText(dataFile);
            });
          };
          CSVData = await getCSVData(dataFile);
          // console.log('CSV DATA from WEB', CSVData);
        }
      }

      if (CSVData) {
        const csvObj = createCSVObject(CSVFile, CSVData);
        saveCSV(csvObj);
        console.log('.CSV saved successfully!');
        dispatch(setLoadingStatus({view: 'home', bool: false}));
      }
    }
    catch (err) {
      console.log('ERR', err);
      dispatch(setLoadingStatus({view: 'home', bool: false}));
      console.error('Error reading .CSV file', err);
    }
  };

  const saveCSV = () => {
    try {
      let savedTables;
      let editedData = spot.properties.data ? JSON.parse(JSON.stringify(spot.properties.data)) : {};
      if (spot.properties.data?.tables) savedTables = spot.properties.data.tables;
      console.log(savedTables);
      if (!editedData.tables) editedData.tables = [];
      editedData.tables.push(csvObject);
      console.log(editedData);
      dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
      dispatch(editedSpotProperties({field: 'data', value: editedData}));
    }
    catch (err) {
      console.error('Error saving .CSV file');
      toast.show('Error saving .CSV file', {type: 'warning', placement: 'top'});
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
    else throw Error();
  };

  return {
    deleteCSV,
    deleteURL,
    readCSV,
    saveCSV,
    saveEdits,
    saveURL,
  };
};

export default useExternalData;
