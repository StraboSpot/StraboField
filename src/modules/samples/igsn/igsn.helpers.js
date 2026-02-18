import moment from 'moment';

import {isEmpty, truncateText} from '../../../shared/Helpers';

const parseString = require('react-native-xml2js').parseString;

export const buildSesarXmlSchema = (data, isUpdating) => {
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
           ${data.longitude_end ? `<longitude_end>${data.longitude_end}</longitude_end>` : ''}
           ${data.latitude_end ? `<latitude_end>${data.latitude_end}</latitude_end>` : ''}
           ${isEmpty(
    data.collection_start_date) ? `<collection_start_date>${data.collection_start_date}</collection_start_date>` : ''}
           <purpose>${data.purpose}</purpose>
           <description>${data.description}</description>
           <material>${data.material}</material>
           <sample_type>${data.sample_type}</sample_type>
           <name>${data.name}</name>
      </sample>
  </samples>`;
};

export const convertAndBuildSchema = (mappedArray, isUpdating) => {
  const jsonData = convertToJSON(mappedArray);
  console.log(jsonData);
  const collectionDate = !isEmpty(jsonData.collection_start_date) ? truncateDateISOString(
      jsonData.collection_start_date)
    : null;
  const updatedJsonData = {...jsonData, collection_start_date: collectionDate};
  const xmlSchema = buildSesarXmlSchema(updatedJsonData, isUpdating);
  console.log('SESAR SCHEMA', xmlSchema);
  return xmlSchema;
};

export const convertToJSON = (mappingArray) => {
  return mappingArray.slice().reverse().reduce((acc, item) => {
    if (item.sesarKey && item.value !== undefined) {
      acc[item.sesarKey] = item.value;
    }
    return acc;
  }, {});
};

export const getMaterialName = (materialType) => {
  if (materialType === 'intact_rock' || materialType === 'fragmented_roc') {
    return 'Rock';
  }
  else if (materialType === 'carbon_or_animal') return 'Organic Material';
  else return materialType;
};

export const isTokenExpired = (accessToken) => {
  if (!accessToken) return true; // No token = expired
  try {
    const accessTokenParsed = JSON.parse(atob(accessToken.split('.')[1]));
    return accessTokenParsed.exp < Math.floor(Date.now() / 1000); // Compare expiration to current time
  }
  catch (error) {
    return true; // If decoding fails, assume expired
  }
};

export const isoToLocalDateTime = (isoString, type) => {
  const date = new Date(isoString);
  const timeAndDate = type === 'time' ? date.toLocaleTimeString('en-US') : date.toLocaleDateString('en-US');
  return timeAndDate;
};

export const parseXML = (xmlData) => {
  let json;
  parseString(xmlData, {trim: true}, (err, result) => {
    console.dir(result);
    json = result;
  });
  return json;
};

export const formatContentItems = (item) => {
  if (item.sesarKey === 'longitude' || item.sesarKey === 'latitude'
    || item.sesarKey === 'longitude_end' || item.sesarKey === 'latitude_end') {
    return item.value;
  }
  if (item.sesarKey === 'collection_start_date') {
    return moment(item.value).format('MM-DD-YYYY (h:mm:ss a)');
  }
  if (item.sesarKey === 'collection_time') {
    return isoToLocalDateTime(item.value, 'time');
  }
  if (item.sesarKey === 'description') return truncateText(item.value, 30);
  else return item.value;
};

export const truncateDateISOString = (date) => {
  return date.slice(0, date.indexOf('.')) + 'Z';
};
