import {useSelector} from 'react-redux';

import {SAMPLE_FORM_NAME} from '../samples.constants';
import {getMaterialName} from './igsn.helpers';
import useForm from '../../form/useForm';

const useIGSN = () => {
  /* Data Hooks */

  const {name} = useSelector(state => state.user);
  const selectedSpot = useSelector(state => state.spot.selectedSpot);

  const {getLabel} = useForm();

  /* Internal Functions */

  const getFirstAndLastElementsOfLineArray = () => {
    if (selectedSpot.geometry.type === 'LineString' && selectedSpot.geometry.coordinates.length > 1) {
      const firstElement = selectedSpot.geometry.coordinates[0];
      const lastElement = selectedSpot.geometry.coordinates[selectedSpot.geometry.coordinates.length - 1];
      return [firstElement, lastElement];
    }
    return [];
  };

  /* Exported Functions */

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

  return {
    straboSesarMapping,
  };
};

export default useIGSN;
