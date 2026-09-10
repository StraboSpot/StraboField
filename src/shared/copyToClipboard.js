import Clipboard from '@react-native-clipboard/clipboard';

// Native setString is fire-and-forget and has no failure mode worth reporting; the .web.js override does the
// write itself so callers can tell whether it actually landed.
const copyToClipboard = async (text) => {
  Clipboard.setString(text);
  return true;
};

export default copyToClipboard;
