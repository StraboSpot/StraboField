import React from 'react';

import {XMLParser} from 'fast-xml-parser';
import {useDispatch, useSelector} from 'react-redux';

import useServerRequests from '../../services/useServerRequests';
import useForm from '../form/useForm';
import {setSesarToken, setSesarUserCodes} from '../user/userProfile.slice';

const useSamples = () => {
  const formName = ['general', 'samples'];
  const dispatch = useDispatch();

  const {getLabel} = useForm();
  const {getSesarUserCode, postToSesar, refreshSesarToken, updateSampleWithSesar} = useServerRequests();
  const {sesar, name} = useSelector(state => state.user);

  const authenticateWithSesar = async () => {
    const validSesarToken = await getValidToken();
    if (!validSesarToken) {
      console.log('No valid token, redirecting to login...');
      return false;
    }
    else return validSesarToken;
  };

  const buildSesarXmlSchema = (data, isUpdating) => {
    // const userCode = !isUpdating ? <user_code>${data.user_code}</user_code> : ""
    return `content=<?xml version="1.0" encoding="UTF-8"?>
  <samples xmlns="http://app.geosamples.org"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="http://app.geosamples.org/4.0/sample.xsd">
      <sample>
           ${!isUpdating ? `<user_code>${data.user_code}</user_code>` : ''}
           <collector>${data.collector}</collector>
           ${data.igsn ? `<igsn>${data.igsn}</igsn>` : ''}
           <longitude>${data.longitude}</longitude>
           <latitude>${data.latitude}</latitude>
           <collection_start_date>${data.collection_start_date}</collection_start_date>
           <purpose>${data.purpose}</purpose>
           <description>${data.description}</description>
           <material>${data.material}</material>
           <sample_type>${data.sample_type}</sample_type>
           <name>${data.name}</name>
      </sample>
  </samples>`;
  };

  const convertAndBuildSchema = (mappedArray, isUpdating) => {
    const jsonData = convertToJSON(mappedArray);
    console.log(jsonData);
    const updatedJsonData = {...jsonData, collection_start_date: truncateDateISOString(jsonData.collection_start_date)};
    const xmlSchema = buildSesarXmlSchema(updatedJsonData, isUpdating);
    console.log('SESAR SCHEMA', xmlSchema);
    return xmlSchema;
  };

  const convertToJSON = (mappingArray) => {
    return mappingArray.slice().reverse().reduce((acc, item) => {
      if (item.sesarKey && item.value !== undefined) {
        acc[item.sesarKey] = item.value;
      }
      return acc;
    }, {});
  };

  const getAndSaveSesarCode = async (token) => {
    const res = await getSesarUserCode(token);
    const jsonData = parseXML(res);
    if (jsonData.results.valid === 'yes') {
      dispatch(setSesarUserCodes(jsonData.results.user_codes.user_code));
    }
    else throw Error();
  };

  const getMaterialName = (materialType) => {
    if (materialType === 'intact_rock' || materialType === 'fragmented_roc') {
      return 'Rock';
    }
    else if (materialType === 'carbon_or_animal') return 'Organic Material';
    else return materialType;
  };

  const getValidToken = async () => {
    let token = sesar?.sesarToken;
    if (isTokenExpired(token)) {
      console.log('Token expired, refreshing...');
      token = await refreshToken(token.refresh);
    }
    return token;
  };

  const isTokenExpired = (accessToken) => {
    if (!accessToken) return true; // No token = expired
    try {
      const accessTokenParsed = JSON.parse(atob(accessToken.split('.')[1]));
      return accessTokenParsed.exp < Math.floor(Date.now() / 1000); // Compare expiration to current time
    }
    catch (error) {
      return true; // If decoding fails, assume expired
    }
  };

  const onSampleFormChange = (formCurrent, name, value) => {
    console.log(name, 'changed to', value);
    name === 'collection_date'
      ? formCurrent.setFieldValue('collection_time', value)
      : name === 'collection_time'
        ? formCurrent.setFieldValue('collection_date', value)
        : formCurrent.setFieldValue(name, value);
    // formCurrent.setFieldValue(name, value);
  };

  const parseXML = (xmlData) => {
    const parser = new XMLParser();
    return parser.parse(xmlData);
  };

  const postSampleToSesar = async (xmlSchema, sample, isUpdating) => {
    const response = isUpdating ? await updateSampleWithSesar(xmlSchema) : await postToSesar(xmlSchema);
    const resText = await response.text();
    const json = parseXML(resText);
    console.log('SAMPLE Response json', json);
    if (response.ok) return json.results.sample;
    else if (json.results.error || json.results.sample.error) throw Error(json.results.error || json.results.sample.error);
    else throw Error('Something happened. Please try again later.');
  };

  const refreshToken = async (refreshToken) => {
    try {
      const newTokens = await refreshSesarToken(refreshToken);
      console.log(newTokens);
      if (newTokens.error) {
        console.error('Token refresh failed:', newTokens.error);
        return null;
      }
      dispatch(setSesarToken(newTokens));
      return newTokens;
    }
    catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  const straboSesarMapping = (sampleValue) => {
    const mappedObj = [
      {label: 'IGSN:', sesarKey: 'igsn', value: sampleValue?.Sample_IGSN}, // required when updating sample
      {label: 'User Code', sesarKey: 'user_code', value: sampleValue.sesarUserCode}, //required
      {label: 'Sample Type:', sesarKey: 'sample_type', value: getLabel(sampleValue?.sample_type, formName)}, //required
      {label: 'Sample Name:', sesarKey: 'name', value: sampleValue.sample_id_name}, //required
      {label: 'Material:', sesarKey: 'material', value: getMaterialName(sampleValue?.material_type)}, //required
      // {label: 'Classification:', sesarKey: 'classification', value: getRockClassification()}, //required
      {label: 'Description:', sesarKey: 'description', value: sampleValue?.sample_description},
      {label: 'Purpose:', sesarKey: 'purpose', value: sampleValue?.main_sampling_purpose},
      {label: 'Collection Date (Time):', sesarKey: 'collection_start_date', value: sampleValue?.collection_date},
      // {label: 'Collection Time:', sesarKey: 'collection_time', value: sampleValue?.collection_time},
      {label: 'Latitude:', sesarKey: 'latitude', value: sampleValue?.latitude},
      {label: 'Longitude:', sesarKey: 'longitude', value: sampleValue?.longitude},
      {label: 'Collector:', sesarKey: 'collector', value: name},
    ];
    return mappedObj;
  };

  const truncateDateISOString = (date) => {
    return date.slice(0, date.indexOf('.')) + 'Z';
  };

  const updateSampleIsSesar = async (updatedSample) => {
    console.log('Update sample', updatedSample);
    const mappedArray = straboSesarMapping(updatedSample);
    console.log(mappedArray);
    const xmlSchema = convertAndBuildSchema(mappedArray, true);
    return await postSampleToSesar(xmlSchema, updatedSample, true);
  };

  const uploadSample = async (sample) => {
    // setSampleValue(sample);
    const mappedArray = straboSesarMapping(sample);
    console.log('Register sample', mappedArray);
    const xmlSchema = convertAndBuildSchema(mappedArray, false);
    return await postSampleToSesar(xmlSchema, sample);
  };

  return {
    authenticateWithSesar: authenticateWithSesar,
    getAndSaveSesarCode: getAndSaveSesarCode,
    onSampleFormChange: onSampleFormChange,
    straboSesarMapping: straboSesarMapping,
    updateSampleIsSesar: updateSampleIsSesar,
    uploadSample: uploadSample,
  };
};

export default useSamples;
