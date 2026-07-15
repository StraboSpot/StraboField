import RNFS from 'react-native-fs';

// Reads the EXIF "Orientation" tag (1-8) from a JPEG so the resize step can compensate
// for orientations that RCTImageLoader (inside @bam.tech/react-native-image-resizer) fails
// to apply. In particular it drops the 180°/"Down" case (tag 3), leaving those photos
// upside down; see resizeImageForDevice in useImageSize.js.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Minimal base64 -> byte array (Hermes has no reliable atob).
const base64ToBytes = (b64) => {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = B64.indexOf(clean[i]);
    const e1 = B64.indexOf(clean[i + 1]);
    const e2 = B64.indexOf(clean[i + 2]);
    const e3 = B64.indexOf(clean[i + 3]);
    bytes.push((e0 << 2) | (e1 >> 4));
    if (clean[i + 2] !== undefined) bytes.push(((e1 & 15) << 4) | (e2 >> 2));
    if (clean[i + 3] !== undefined) bytes.push(((e2 & 3) << 6) | e3);
  }
  return bytes;
};

// Returns the EXIF orientation int (1-8), or null if the file has no orientation tag,
// isn't a readable JPEG, or can't be read.
export const readExifOrientation = async (uri) => {
  try {
    const path = uri.replace('file://', '');
    // RNFS.read() uses NSInteger args the new architecture rejects, so read the whole file
    // as base64 and slice off just the header (~67KB) — EXIF lives at the very start.
    const b64full = await RNFS.readFile(path, 'base64');
    const d = base64ToBytes(b64full.slice(0, 90000));
    if (d[0] !== 0xff || d[1] !== 0xd8) return null; // not a JPEG

    let offset = 2;
    while (offset + 4 < d.length) {
      if (d[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = d[offset + 1];
      const size = (d[offset + 2] << 8) | d[offset + 3];
      if (marker === 0xe1) {
        // APP1 — expect "Exif\0\0" then TIFF header
        const tiff = offset + 10;
        const little = d[tiff] === 0x49; // 'II' little-endian, 'MM' big-endian
        const u16 = p => (little ? d[p] | (d[p + 1] << 8) : (d[p] << 8) | d[p + 1]);
        const u32 = p => (little
          ? d[p] | (d[p + 1] << 8) | (d[p + 2] << 16) | (d[p + 3] << 24)
          : (d[p] << 24) | (d[p + 1] << 16) | (d[p + 2] << 8) | d[p + 3]);
        const ifd = tiff + u32(tiff + 4);
        const count = u16(ifd);
        for (let i = 0; i < count; i++) {
          const entry = ifd + 2 + i * 12;
          if (u16(entry) === 0x0112) return u16(entry + 8); // Orientation tag
        }
        return null;
      }
      if (marker === 0xda) break; // start of scan — no more metadata
      offset += 2 + size;
    }
    return null;
  }
  catch (err) {
    console.warn('Could not read EXIF orientation:', err.message);
    return null;
  }
};
