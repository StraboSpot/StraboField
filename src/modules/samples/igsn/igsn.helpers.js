import moment from 'moment';

import {isEmpty, truncateText} from '../../../shared/helpers';

// StraboSpot's sample type labels mapped to SESAR v2 object type vocabulary labels where they differ. SESAR v2
// rejects any object_type that isn't a current vocabulary label; the other StraboSpot labels already match one.
const SESAR_OBJECT_TYPES = {
  'ctd': 'CTD sample',
  'individual sample': 'Individual sample',
  'other': 'Material sample',
  'rock powder': 'Powder',
  'terrestrial section': 'Terrestrial section',
};

// StraboSpot's material names (from getMaterialName) mapped to SESAR v2 material type labels that are open for
// registration. v2 rejects the legacy categories Rock and Organic Material, and has no registrable generic rock
// label at all (only specific rock names), so rock goes to Other material until StraboSpot collects a rock type.
const SESAR_MATERIAL_TYPES = {
  'organic material': 'Biological material',
  'other': 'Other material',
  'rock': 'Other material',
  'sediment': 'Sediment',
  'tephra': 'Tephra',
};

// SESAR's DOI prefix for IGSNs it issued before v2; v2 stores those as `10.58052/<legacy IGSN>`.
const SESAR_LEGACY_IGSN_PREFIX = '10.58052';

// SESAR v2 looks samples up by the full `prefix/suffix` IGSN and 404s on a bare one. The legacy XML API returned bare
// IGSNs (e.g. IEABC0001), so samples registered before the v2 move have them stored without a prefix.
export const toFullIgsn = igsn => igsn.includes('/') ? igsn : `${SESAR_LEGACY_IGSN_PREFIX}/${igsn}`;

// Builds the SESAR v2 JSON body for POST /samples/ (register) or PATCH /samples/{igsn}/ (update). Empty values are
// left out rather than sent as null, since a PATCH would otherwise clear those fields on SESAR.
export const buildSesarSamplePayload = (mappedArray, isUpdating) => {
  const data = convertToJSON(mappedArray);
  console.log('Building SESAR payload', data);
  const isCoordinate = value => !isEmpty(value) && !isNaN(Number(value));
  const coordinates = ['latitude', 'longitude', 'latitude_end', 'longitude_end']
    .filter(key => isCoordinate(data[key]))
    .reduce((acc, key) => ({...acc, [key]: data[key]}), {});
  const payload = {
    // sesar_code is fixed once registered; SESAR rejects it on update.
    ...(!isUpdating && {sesar_code: data.user_code}),
    name: data.name,
    object_type: SESAR_OBJECT_TYPES[data.sample_type?.toLowerCase()] ?? data.sample_type,
    // The legacy XML `material` is v2's general_material_type; material_types is the vocabulary classification,
    // which StraboSpot doesn't collect. Only sent on registration: samples migrated from v1 still carry legacy
    // values like Rock that v2 won't accept back, and a PATCH leaves an omitted field as it is.
    ...(!isUpdating && {
      general_material_type: SESAR_MATERIAL_TYPES[data.material?.toLowerCase()] ?? data.material,
    }),
    sample_description: data.description,
    purpose: data.purpose,
    ...coordinates,
    sampling_start_date: !isEmpty(data.collection_start_date)
      ? truncateDateISOString(data.collection_start_date)
      : undefined,
    other_names: !isEmpty(data.sample_other_name) ? [String(data.sample_other_name)] : undefined,
    collectors: !isEmpty(data.collector) ? [{individual: {label: data.collector}}] : undefined,
  };
  const sesarPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => !isEmpty(value)));
  console.log('SESAR PAYLOAD', sesarPayload);
  return sesarPayload;
};

export const convertToJSON = (mappingArray) => {
  return mappingArray.slice().reverse().reduce((acc, item) => {
    if (item.sesarKey && item.value !== undefined) {
      acc[item.sesarKey] = item.value;
    }
    return acc;
  }, {});
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

export const getMaterialName = (materialType) => {
  if (materialType === 'intact_rock' || materialType === 'fragmented_roc') {
    return 'Rock';
  }
  else if (materialType === 'carbon_or_animal') return 'Organic Material';
  else return materialType;
};

export const isoToLocalDateTime = (isoString, type) => {
  const date = new Date(isoString);
  const timeAndDate = type === 'time' ? date.toLocaleTimeString('en-US') : date.toLocaleDateString('en-US');
  return timeAndDate;
};

export const isTokenExpired = (token) => {
  if (!token) return true; // No token = expired
  try {
    // A JWT's payload is base64url (- and _, no padding), which atob rejects. Left as is, many valid tokens failed
    // to decode and were reported as expired.
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const tokenParsed = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return tokenParsed.exp < Math.floor(Date.now() / 1000); // Compare expiration to current time
  }
  catch (err) {
    return true; // If decoding fails, assume expired
  }
};

export const truncateDateISOString = (date) => {
  return date.slice(0, date.indexOf('.')) + 'Z';
};
