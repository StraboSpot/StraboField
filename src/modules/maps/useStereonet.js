import {useDispatch, useSelector} from 'react-redux';

import {STEREONET_HEADERS} from './maps.constants';
import copyToClipboard from '../../shared/copyToClipboard';
import {getTimeAndDateFromModifiedTimestamp} from '../../shared/helpers';
import {openedMessageModal} from '../home/home.slice';
import {FIRST_ORDER_CLASS_FIELDS, SECOND_ORDER_CLASS_FIELDS} from '../measurements/measurements.constants';

const useStereonet = () => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const userName = useSelector(state => state.user?.name);

  /* Internal Functions */

  // Report the copy result in the app's own modal rather than a native/browser alert.
  const showResultModal = (title, message) => dispatch(openedMessageModal({message, title}));

  /* Exported Functions */

  const getStereonet = async (spots) => {
    let hasData = false;

    let planes = [];
    let lines = [];
    let out = [];

    spots.forEach((spot) => {
      const longitude = spot.geometry.type === 'Point' ? spot.geometry?.coordinates?.[0] : 999;
      const latitude = spot.geometry.type === 'Point' ? spot.geometry?.coordinates?.[1] : 99;
      let geologist = userName;
      let associatedObs = [];
      let spotOrientations = [];
      let horizontalAccuracy = spot.properties.gps_accuracy ? spot.properties.gps_accuracy.toFixed(4) : 0;
      let elevation = spot.properties.altitude ? spot.properties.altitude.toFixed(4) : 0;
      let altitudeAccuracy = spot.properties.altitude_accuracy ? spot.properties.altitude_accuracy.toFixed(4) : 0;
      const d = getTimeAndDateFromModifiedTimestamp(spot.properties.modified_timestamp);

      // Gather individual orientation data measurements.
      if (spot.properties.orientation_data) {
        spot.properties.orientation_data.forEach((od) => {
          spotOrientations.push(od);
          associatedObs.push(od.associated_orientation?.length || 0);
          if (od.associated_orientation) {
            od.associated_orientation.forEach((ao) => {
              spotOrientations.push(ao);
              associatedObs.push(0);
            });
          }
        });
      }

      spotOrientations.forEach((od, index) => {
        console.log('Spot Orientation', od);
        console.log(d.time, '\n', d.day, '\n', d.month, '\n', d.year);
        const trendStrike = od.strike || od.trend || 0;
        const plungeDip = od.dip || od.plunge || 0;
        const type = od.type === 'linear_orientation' ? 'L' : 'P';
        const featureTypeField = FIRST_ORDER_CLASS_FIELDS.find(firstOrderClassField => od[firstOrderClassField]);
        const planeDetailField = SECOND_ORDER_CLASS_FIELDS.find(secondOrderClassField => od[secondOrderClassField]);
        const featureType = od[featureTypeField] || '';
        const notes = od.notes || '';
        const quality = od.quality || 5;
        const planeThickness = od.thickness || 0;
        const planeLength = od.length || 0;
        const planeDetail = od[planeDetailField] || '';
        const planeAddlDetail = '';
        const unixTimestamp = od.unix_timestamp ? (od.unix_timestamp) / 1000 : Date.parse(spot.properties.time) / 1000;
        const modifiedTimestamp = od.modified_timestamp ? od.modified_timestamp / 1000 : spot.properties.modified_timestamp / 1000; // Converting into seconds from milliseconds

        const row = [             // Headers
          '',                     // No.
          type,                   // Type
          featureType,            // Structure
          '000000000',            // Color
          trendStrike,            // Trd/Strk
          plungeDip,              // Plg/Dip
          longitude,              // Longitude
          latitude,               // Latitude
          horizontalAccuracy,
          elevation,
          altitudeAccuracy,                 // Elev ± m
          d.time,                 // Time
          d.day,                  // Day
          d.month,                // Month
          d.year,                 // Year
          notes,                  // Notes
          '1',                    // Checked
          featureType,            // Strabo Type
          quality,                // Quality
          planeDetail,            // Strabo Plane Detail
          planeAddlDetail,        // Strabo Plane Addl Detail
          planeThickness,         // Plane Thickness
          planeLength,            // Plane Length
          geologist,              // Geologist
          unixTimestamp,          // UnixTimeStamp
          modifiedTimestamp,       // Modified Timestamp
          associatedObs[index],   // Associated Obs
          'From Strabo',          // Method
        ];
        od.type === 'linear_orientation' ? lines.push(row) : planes.push(row);
      });
    });

    if (lines.length > 0 || planes.length > 0) {
      let recordNum = 1;
      out.push(STEREONET_HEADERS.join('\t'));
      if (planes.length > 0) {
        planes.forEach((plane) => {
          plane[0] = recordNum;
          out.push(plane.join('\t'));
          recordNum++;
        });
      }
      if (lines.length > 0) {
        lines.forEach((line) => {
          line[0] = recordNum;
          out.push(line.join('\t'));
          recordNum++;
        });
      }
      out = out.join('\n');
      out = out + '\n';
      hasData = true;
    }

    if (!hasData) showResultModal('Error!', 'Your selected Spots contained no valid stereonet data.');
    else if (await copyToClipboard(out)) showResultModal('Success!', 'Data has been copied to clipboard.');
    else showResultModal('Error!', 'Unable to copy the data to the clipboard.');
  };

  return {
    getStereonet,
  };
};

export default useStereonet;
