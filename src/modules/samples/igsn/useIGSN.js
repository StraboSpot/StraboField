import {useDispatch, useSelector} from 'react-redux';

import {SAMPLE_FORM_NAME} from '../samples.constants';
import {convertAndBuildSchema, getMaterialName, isTokenExpired, parseXML} from './igsn.helpers';
import useServerRequests from '../../../services/network/useServerRequests';
import useForm from '../../form/useForm';
import {setSesarToken} from '../../user/userProfile.slice';

const useIGSN = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {name, sesar} = useSelector(state => state.user);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();
  const {getSesarUserCode, postToSesar, refreshSesarToken, updateSampleWithSesar} = useServerRequests();

  /* Internal Functions */

  const getFirstAndLastElementsOfLineArray = () => {
    if (selectedSpot.geometry.type === 'LineString' && selectedSpot.geometry.coordinates.length > 1) {
      const firstElement = selectedSpot.geometry.coordinates[0];
      const lastElement = selectedSpot.geometry.coordinates[selectedSpot.geometry.coordinates.length - 1];
      return [firstElement, lastElement];
    }
    return [];
  };

  const getValidToken = async (sesarTokens) => {
    let tokens = sesarTokens;
    if (isTokenExpired(tokens.access)) {
      console.log('Token expired, refreshing...');
      tokens = await refreshToken(tokens.refresh);
    }
    return tokens;
  };

  const postSampleToSesar = async (xmlSchema, isUpdating) => {
    const response = isUpdating ? await updateSampleWithSesar(xmlSchema) : await postToSesar(xmlSchema);
    const resText = await response.text();
    const json = parseXML(resText);
    console.log('SAMPLE Response json', json);
    if (response.ok) {
      const singleResObject = Object.fromEntries(
        Object.entries(json.results.sample[0]).map(([key, value]) => [key, value[0]]),
      );
      console.log(singleResObject);
      return singleResObject;
    }
    else if (json.results.error) throw Error(json.results.error[0]);
    else {
      console.log(json.results.sample[0]);
      return json.results.sample[0];
    }
  };

  const refreshToken = async (refresh) => {
    try {
      const newTokens = await refreshSesarToken(refresh);
      console.log(newTokens);
      if (newTokens.error) {
        console.error('Token refresh failed:', newTokens.error);
        return null;
      }
      dispatch(setSesarToken(newTokens));
      return newTokens;
    }
    catch (err) {
      console.error('Token refresh failed:', err);
      return null;
    }
  };

  /* Exported Functions */

  const authenticateWithSesar = async (sesarTokens) => {
    const validSesarTokens = await getValidToken(sesarTokens);
    if (!validSesarTokens) {
      console.log('No valid token, redirecting to login...');
      return false;
    }
    else return validSesarTokens;
  };

  const getAndSaveSesarCode = async (sesarTokens) => {
    const xml = await getSesarUserCode(sesarTokens.access);
    let json = parseXML(xml);

    if (json.results.valid.includes('yes')) return json;
    else if (json.results.error) throw Error(json.results.error);
    else {
      const newTokens = await getValidToken(sesarTokens);
      return await getAndSaveSesarCode(newTokens);
    }
  };

  const straboSesarMapping = (sampleValue) => {
    console.log('sampleValue', sampleValue);
    const geometryType = selectedSpot?.geometry?.type;
    let longitude;
    let latitude;
    let longitudeEndObj = {};
    let latitudeEndObj = {};
    if (geometryType === 'LineString' && selectedSpot.geometry.coordinates.length > 1) {
      console.log('LineString spot', selectedSpot);
      const lineArray = getFirstAndLastElementsOfLineArray();
      console.log('lineArray', lineArray);
      longitude = lineArray[0][0].toFixed(6);
      latitude = lineArray[0][1].toFixed(6);
      longitudeEndObj = {label: 'Longitude End:', sesarKey: 'longitude_end', value: lineArray[1][0].toFixed(6)};
      latitudeEndObj = {label: 'Latitude End:', sesarKey: 'latitude_end', value: lineArray[1][1].toFixed(6)};
    }
    else if (geometryType === 'Point') {
      longitude = selectedSpot?.geometry?.coordinates
        ? selectedSpot?.geometry?.coordinates?.[0]?.toFixed(6)
        : 'No coordinates assigned';
      latitude = selectedSpot?.geometry?.coordinates
        ? selectedSpot?.geometry?.coordinates?.[1]?.toFixed(6)
        : 'No coordinates assigned';
    }
    const mappedObj = [
      {label: 'IGSN:', sesarKey: 'igsn', value: sampleValue?.Sample_IGSN}, // required when updating sample
      {label: 'Sample ID:', sesarKey: 'sample_other_name', value: sampleValue?.id},
      {label: 'Longitude:', sesarKey: 'longitude', value: longitude},
      {label: 'Latitude:', sesarKey: 'latitude', value: latitude},
      ...(geometryType !== 'Point' ? [longitudeEndObj] : []),
      ...(geometryType !== 'Point' ? [latitudeEndObj] : []),
      {label: 'User Code', sesarKey: 'user_code', value: sesar.selectedUserCode}, //required
      {label: 'Sample Type:', sesarKey: 'sample_type', value: getLabel(sampleValue?.sample_type, SAMPLE_FORM_NAME)}, //required
      {label: 'Sample Name:', sesarKey: 'name', value: sampleValue.sample_id_name}, //required
      {label: 'Material:', sesarKey: 'material', value: getMaterialName(sampleValue?.material_type)}, //required
      // {label: 'Classification:', sesarKey: 'classification', value: getRockClassification()}, //required
      {label: 'Description:', sesarKey: 'description', value: sampleValue?.sample_description},
      {label: 'Purpose:', sesarKey: 'purpose', value: sampleValue?.main_sampling_purpose},
      {
        label: 'Collection Date (Time):',
        sesarKey: 'collection_start_date',
        value: sampleValue?.collection_date || selectedSpot.properties.date,
      },
      // {label: 'Collection Time:', sesarKey: 'collection_time', value: sampleValue?.collection_time},
      {label: 'Collector:', sesarKey: 'collector', value: name},
      {label: 'URL:', sesarKey: 'url', value: 'http://www.strabospot.org'},
    ];
    return mappedObj;
  };

  const updateSampleIsSesar = async (mappedArray) => {
    // console.log('Update sample', updatedSample);
    // const mappedArray = straboSesarMapping(updatedSample);
    // console.log(mappedArray);
    const xmlSchema = convertAndBuildSchema(mappedArray, true);
    return await postSampleToSesar(xmlSchema, true);
  };

  const uploadSample = async (mappedArray) => {
    // setSampleValue(sample);
    // const mappedArray = straboSesarMapping(sample);
    // console.log('Register sample', mappedArray);
    const xmlSchema = convertAndBuildSchema(mappedArray, false);
    return await postSampleToSesar(xmlSchema);
  };

  return {
    authenticateWithSesar,
    getAndSaveSesarCode,
    straboSesarMapping,
    updateSampleIsSesar,
    uploadSample,
  };
};

export default useIGSN;
