import React, {useEffect, useRef, useState} from 'react';

import ClearButton from './ClearButton';
import copyToClipboard from '../../copyToClipboard';

const COPY_BUTTON_TITLE = 'Copy JSON to Clipboard';
const RESET_DELAY = 2000;

// Reports the outcome on the button itself. These buttons live inside modals, where a toast would be painted
// behind the modal and never seen. getText is called on press so large objects aren't stringified on every render.
const CopyToClipboardButton = ({getText}) => {
  /* Local State */

  const [buttonTitle, setButtonTitle] = useState(COPY_BUTTON_TITLE);
  const resetTimeout = useRef(null);

  /* Side Effects */

  useEffect(() => () => clearTimeout(resetTimeout.current), []);

  /* Event Handlers */

  const onPress = async () => {
    const isCopied = await copyToClipboard(getText());
    setButtonTitle(isCopied ? 'Copied!' : 'Unable to Copy');
    resetTimeout.current = setTimeout(() => setButtonTitle(COPY_BUTTON_TITLE), RESET_DELAY);
  };

  /* View */

  return <ClearButton onPress={onPress} title={buttonTitle}/>;
};

export default CopyToClipboardButton;
