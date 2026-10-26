import moment from 'moment';

import {truncateText} from '../../../shared/helpers';

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
