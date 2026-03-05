import {hexToRgb} from '../../shared/Helpers';

/* Internal Functions */

const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

/* Exported Functions */

export const getRGBString = (hex) => {
  if (hex) {
    const {r, g, b} = hexToRgb(hex);
    return `${r}, ${g}, ${b}`;
  }
};

export const isValidHexColor = (str) => {
  const hexRegex = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
  return hexRegex.test(str);
};

export const rgbToHex = (r, g, b) => {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
