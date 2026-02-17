import {useCallback, useState} from 'react';

import {errorCodes, isErrorWithCode, pick} from '@react-native-documents/picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import {setLoadingStatus} from '../modules/home/home.slice';

const useSafeDocumentPicker = () => {
  /* Data Hooks */

  const dispatch = useDispatch();

  const toast = useToast();

  /* Local State */

  const [isPicking, setIsPicking] = useState(false);

  /* Derived State */

  const handleError = useCallback((err) => {
    console.log(isErrorWithCode(err));
    if (isErrorWithCode(err)) {
      switch (err.code) {
        case errorCodes.IN_PROGRESS:
          console.warn('user attempted to present a picker, but a previous one was already presented');
          // toast.show('Getting project.', {placement: 'top'});
          return false;
        case errorCodes.UNABLE_TO_OPEN_FILE_TYPE:
          toast.show('Unable to open the selected file.', {type: 'warning', placement: 'top'});
          return false;
        case errorCodes.OPERATION_CANCELED:
          console.warn('User canceled document selection');
          // toast.show('Nothing was selected.', {type: 'warning', placement: 'top'});
          return true;
        default:
          console.error(err);
          return false;
      }
    }
    else {
      console.error(err);
      return false;
    }
  }, [toast]);

  const safePick = useCallback(async (options) => {
    if (isPicking) return null;
    setIsPicking(true);
    try {
      return await pick(options);
    }
    catch (error) {
      dispatch(setLoadingStatus({bool: false, view: 'home'}));
      handleError(error);
      // Return null on cancellation or error
      return null;
    }
    finally {
      setIsPicking(false);
    }
  }, [isPicking, dispatch, handleError]);

  return {
    handleError,
    isPicking,
    safePick,
  };
};

export default useSafeDocumentPicker;
