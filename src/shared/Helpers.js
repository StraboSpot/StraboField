import {Linking, PixelRatio} from 'react-native';

import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';

const lodashIsEqual = require('lodash.isequal');
const passwordValidator = require('password-validator');
const schema = new passwordValidator();

// Check if an array, object, string or number is empty and if so return true
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  else if (typeof value === 'object') return Object.getOwnPropertyNames(value).length < 1;
  else if (typeof value === 'string') return value.length === 0;
  else if (typeof value === 'number') return false;
  else if (!value) return true;
  return false;
};

export const convertSliderValueToMilliseconds = (sliderValue) => {
  const timeMap = {
    0: 2 * 60 * 1000,     // 2 min = 120,000 ms
    1: 5 * 60 * 1000,     // 5 min = 300,000 ms
    2: 20 * 60 * 1000,    // 20 min = 1,200,000 ms
    3: 40 * 60 * 1000,    // 40 min = 2,400,000 ms
    4: null,              // 'ON' = no timeout
  };

  return timeMap[sliderValue];
};

export const convertMillisecondsToTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(milliseconds / (1000 * 60));

  if (minutes >= 1) {
    return `${minutes} min`;
  }
  else if (seconds >= 1) {
    return `${seconds} sec`;
  }
  else {
    return 'No Limit';
  }
};


// Parsing CSV Strings With Javascript Exec() Regular Expression Command
// https://gist.github.com/bennadel/9753411#file-code-1-htm
export const csvToArray = (strData, strDelimiter) => {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ',');
  // Create a regular expression to parse the CSV values.
  const objPattern = new RegExp(
    (
      // Delimiters.
      '(\\' + strDelimiter + '|\\r?\\n|\\r|^)'

      // Quoted fields.
      + '(?:"([^"]*(?:""[^"]*)*)"|'

      // Standard fields.
      + '([^"\\' + strDelimiter + '\\r\\n]*))'
    ),
    'gi',
  );
  // Create an array to hold our data. Give the array
  // a default empty first row.
  const arrData = [[]];
  // Create an array to hold our individual pattern
  // matching groups.
  let arrMatches = null;
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec(strData)) {
    // console.log('arrMatches', arrMatches);
    // Get the delimiter that was found.
    const strMatchedDelimiter = arrMatches[1];
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length
      && strMatchedDelimiter !== strDelimiter
    ) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    }
    let strMatchedValue;
    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      strMatchedValue = arrMatches[2].replace(
        new RegExp('""', 'g'),
        '"',
      );
    }
    else {
      // We found a non-quoted value.
      strMatchedValue = arrMatches[3];
    }
    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }
  // Return the parsed data.
  return (arrData);
};

export const deepFindFeatureById = (obj, id) => {
  //Early return
  if (isEmpty(obj)) return null;
  if (obj.id === id) return obj;
  let result, p;
  for (p in obj) {
    if (obj[p] && typeof obj[p] === 'object') {
      result = deepFindFeatureById(obj[p], id);
      if (result) return result;
    }
  }
  return result;
};

export const deepFindFeatureTypeById = (obj, id) => {
  //Early return
  if (isEmpty(obj)) return null;
  if (obj.id === id) return obj;
  let result, p;
  for (p in obj) {
    if (obj[p] && typeof obj[p] === 'object') {
      result = deepFindFeatureTypeById(obj[p], id);
      if (result) return p;
    }
  }
  return result;
};

// Deep extend an object
export const deepObjectExtend = (target, source) => {
  for (const prop in source) {
    if (source[prop]) {
      if (target[prop] && typeof source[prop] === 'object') deepObjectExtend(target[prop], source[prop]);
      else target[prop] = source[prop];
    }
  }
  return target;
};

export const hasSpace = (filename) => {
  return filename.includes(' ');
};

export const getNewId = () => {
  return Math.floor((new Date().getTime() + Math.random()) * 10);
  // return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
  //   c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
};

// Ids are generated in such quick succession when copying that using
// the getNewId doesn't work since that is based on a timestamp
export const getNewCopyId = () => Math.floor(10000000000000 + Math.random() * 90000000000000);

export const getNewUUID = () => {
  return uuidv4();
};

export const getFontSizeByWindowWidth = (window, fontSize) => {
  const baseWidth = 320; // width of smallest iPhone
  const width = getOrientation(window) === 'portrait' ? window.width : window.height;
  return PixelRatio.roundToNearestPixel(fontSize * (width / baseWidth));
};

export const getLatLngText = (lat, lng) => {
  const degreeSymbol = '\u00B0';
  let latitudeCardinal = Math.sign(lat) >= 0 ? 'N' : 'S';
  let longitudeCardinal = Math.sign(lng) >= 0 ? 'E' : 'W';
  return toFixedInteger(lng, 6) + degreeSymbol + ' ' + longitudeCardinal + ', '
    + toFixedInteger(lat, 6) + degreeSymbol + ' ' + latitudeCardinal;
};

function getOrientation(window) {
  return window.width < window.height ? 'portrait' : 'landscape';
}

export const hexToRgb = (hex) => {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

export const padWithLeadingZeros = (number, length) => {
  return number.toString().padStart(length, '0');
};

// Round value to the number of decimal places in the variable places
export const roundToDecimalPlaces = (value, places) => {
  const multiplier = Math.pow(10, places);
  return (Math.round(value * multiplier) / multiplier);
};

export const toDegrees = (radians) => {
  return radians * 180 / Math.PI;
};

export const toNumberFixedValue = (number, decPlaces) => {
  return Number(number).toLocaleString(undefined, {style: 'percent', minimumFractionDigits: decPlaces});
};

export const toRadians = (deg) => {
  return deg * (Math.PI / 180);
};

export const truncateText = (str, maxLength) => {
  if (str?.length > maxLength) return str.substring(0, maxLength) + '...';
  else return str;
};

export const isEqual = (a, b) => {
  const isEqual = lodashIsEqual(a, b);
  // console.log('isEqual' isEqual);
  return isEqual;
};

// Compare two arrays regardless of order
export const isEqualUnordered = (a, b) => {
  return JSON.stringify(JSON.parse(JSON.stringify(a)).sort()) === JSON.stringify(JSON.parse(JSON.stringify(b)).sort());
};

// Convert a string to title case and properly handles (s) in a word by keeping the s lowercase
export function toTitleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export const openUrl = async (url) => {
  const canOpenUrl = await Linking.canOpenURL(url);
  if (!canOpenUrl) throw Error('Unable to open url!');
  else await Linking.openURL(url);
};

export const readDataUrl = (file, callback) => {
  const reader = new FileReader();
  reader.onloadend = function (evt) {
    // console.log(evt.target.result);
    callback(evt.target.result);
  };
  reader.readAsDataURL(file);
};

export const sleep = (delay) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const toFixedInteger = (value, dp) => {
  // Returns an integer instead of a string
  return +parseFloat(value).toFixed(dp);
};

export const unixToDateTime = (unixTimestamp) => {
  return new Date(unixTimestamp * 1000);
};

export const urlValidator = (fullURL) => {
  const regExp = /^(?:(?:https?):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  return regExp.test(fullURL);
};

export const validate = (val, rules, connectedValue) => {
  let isValid = true;
  for (let rule in rules) {
    switch (rule) {
      case 'isEmail':
        isValid = isValid && emailValidator(val);
        // console.log('isValid:', isValid);
        break;
      case 'minLength':
        isValid = isValid && minLengthValidator(val, rules[rule]);
        // console.log('minLength isValid:', isValid);
        break;
      case 'characterValidator':
        isValid = isValid && passwordValidation(val);
        // console.log('Password Valid', isValid);
        break;
      case 'equalTo':
        isValid = isValid && equalToValidator(val, connectedValue[rule]);
        // console.log('equalTo isValid:', isValid)
        break;
      case 'notEmpty':
        isValid = isValid && notEmptyValidator(val);
        // console.log('notEmpty isValid:', isValid);
        break;
      default:
        isValid = true;
    }
  }
  return isValid;
};

const passwordValidation = (val) => {
  schema.has().digits().uppercase();
  schema.has().not().spaces();
  schema.min(8);
  return schema.validate(val);
};

const emailValidator = (val) => {
  // return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    .test(val);
};

const minLengthValidator = (val, minLength) => {
  return val.length >= minLength;
};

const equalToValidator = (val, checkValue) => {
  return val === checkValue;
};

const notEmptyValidator = (val) => {
  // console.log(val);
  return val.trim() !== '';
};

// Convert 1 to A, 2 to B, ... 27 to AA, 28 to AB, etc
export const numToLetter = num => num <= 0 ? '' : numToLetter(Math.floor((num - 1) / 26)) + String.fromCharCode(
  (num - 1) % 26 + 65);
