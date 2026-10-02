import {useDispatch, useSelector} from 'react-redux';

import {SAMPLE_FORM_NAME} from '../samples.constants';
import {buildSesarSamplePayload, convertToJSON, getMaterialName, isTokenExpired, toFullIgsn} from './igsn.helpers';
import useServerRequests from '../../../services/network/useServerRequests';
import useForm from '../../form/useForm';
import {setSesarToken} from '../../user/userProfile.slice';

const useIGSN = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const {name, sesar} = useSelector(state => state.user);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();
  const {getSesarUserCodes, postToSesar, refreshSesarToken, updateOnSesar} = useServerRequests();

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

  const refreshToken = async (refresh) => {
    try {
      const newTokens = await refreshSesarToken(refresh);
      console.log(newTokens);
      if (newTokens.error || !newTokens.access || !newTokens.refresh) {
        console.error('Token refresh failed:', newTokens.error || 'incomplete token response');
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

  const getAndSaveSesarCode = async (sesarTokens, hasRetried = false) => {
    const codes = await getSesarUserCodes(sesarTokens.access);
    if (codes) return codes;

    // SESAR rejected the access token (401) even if it hasn't expired locally, so force one refresh and retry. A
    // failed refresh, or a second rejection with the fresh token, means the session is gone — bail to re-auth.
    const newTokens = !hasRetried && await refreshToken(sesarTokens.refresh);
    if (!newTokens?.access) throw Error('SESAR_REAUTH_REQUIRED');
    return await getAndSaveSesarCode(newTokens, true);
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

  // Both resolve to the sample SESAR returns (with its `igsn`) and throw a user-facing message on any failure.
  const updateSampleWithSesar = async (mappedArray) => {
    const {igsn} = convertToJSON(mappedArray);
    if (!igsn) throw Error('This sample has no IGSN, so it can\'t be updated on SESAR.');
    // SESAR returns the full IGSN, which registerSample then stores, so a bare legacy IGSN is upgraded in place.
    return await updateOnSesar(toFullIgsn(igsn), buildSesarSamplePayload(mappedArray, true));
  };

  const uploadSample = async (mappedArray) => {
    return await postToSesar(buildSesarSamplePayload(mappedArray, false));
  };

  return {
    authenticateWithSesar,
    getAndSaveSesarCode,
    straboSesarMapping,
    updateSampleWithSesar,
    uploadSample,
  };
};

export default useIGSN;
