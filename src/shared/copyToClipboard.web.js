// @react-native-clipboard/clipboard's web build fires navigator.clipboard.writeText() without awaiting it and
// returns nothing, so a rejected write still reads as a success to the caller. Do the write here instead and
// report the real result.
const copyToClipboard = async (text) => {
  if (navigator?.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    }
    catch (err) {
      console.error('Error copying to clipboard:', err);
      return false;
    }
  }
  // navigator.clipboard is undefined outside a secure context (plain http), so fall back to a hidden textarea.
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  const isCopied = document.execCommand('copy');
  document.body.removeChild(textArea);
  return isCopied;
};

export default copyToClipboard;
