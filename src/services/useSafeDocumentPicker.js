import {useState, useCallback} from 'react';

import {pick, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {useToast} from 'react-native-toast-notifications';
import {useDispatch} from 'react-redux';

import {setLoadingStatus} from '../modules/home/home.slice';

export const useSafeDocumentPicker = () => {
  const [isPicking, setIsPicking] = useState(false);
  const dispatch = useDispatch();
  const toast = useToast();

  const safePick = useCallback(async (options) => {
    if (isPicking) return null;

    setIsPicking(true);
    try {
      return await pick(options);
    }
    catch (error) {
      dispatch(setLoadingStatus({bool: false, view: 'home'}));
      handleError(error);
    }
    finally {
      setIsPicking(false);
    }
  }, [isPicking]);

  const handleError = (err) => {
    console.log(isErrorWithCode(err));
    if (isErrorWithCode(err)) {
      switch (err.code) {
        // case errorCodes.IN_PROGRESS:
        //   toast.show('Getting project.', { placement: 'top'});
        //   break;
        case errorCodes.UNABLE_TO_OPEN_FILE_TYPE:
          toast.show('Unable to open the selected file.', {type: 'warning', placement: 'top'});
          break;
        case errorCodes.OPERATION_CANCELED:
          console.warn(err.code);
          toast.show('Nothing was selected. Please select a .zip file to import.', {type: 'warning', placement: 'top'});
          break;
        default:
          console.error(err);
      }
    }
    else {
      console.error(err);
    }
  };

  return {pick: safePick, isPicking};
};
