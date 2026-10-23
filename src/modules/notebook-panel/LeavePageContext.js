import {createContext, useContext, useEffect, useRef, useState} from 'react';

import {isEqual} from '../../shared/helpers';
import useForm from '../form/useForm';

// The leave-page gate from useLeavePage, provided by HomeContainer to everything that can leave a notebook page
export const LeavePageContext = createContext(null);

// Tells the gate about a notebook page's form, so it can ask about unsaved changes before anything leaves the page.
// save resolves whether it saved, and every save calls markSaved before resetting the form. Neither save nor Discard
// leaves the page, as whatever asked does that, and a menu that asks as it opens may not leave at all, so Discard
// clears the changes from the screen: onDiscard when given, otherwise the form is put back as it was. isAsking
// false is for a form there is nothing to ask about. isChangedOutsideForm counts a change the form doesn't hold,
// such as a template's name. The prompt holds its Save, and says why, while the page's own would be held: while
// the form has errors, or for the reason getSaveHeldReason gives.
export const useUnsavedFormChanges = ({
                                        formRef,
                                        getMessage,
                                        getSaveHeldReason,
                                        isAsking = true,
                                        isChangedOutsideForm = false,
                                        onDiscard,
                                        save,
                                      }) => {
  /* Data Hooks */

  const leavePage = useContext(LeavePageContext);

  const {getErrorMessages} = useForm();

  /* Local State */

  // Identifies this page to the gate. A page replacing another renders before the old one unmounts, so unmounting
  // must only clear its own registration.
  const ownerRef = useRef({});
  // The values last saved or discarded. The form's dirty flag alone can't say: the page can unmount in the same
  // render pass as a save, with the form ref still holding the form from before it.
  const savedValuesRef = useRef(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Side Effects */

  // isFormDirty is reported as state for what has to know as it renders, such as whether a phone swipe can leave
  useEffect(() => {
    leavePage?.reportOpenPageChanged(ownerRef.current, isAsking && (isFormDirty || isChangedOutsideForm));
  }, [isAsking, isChangedOutsideForm, isFormDirty]);

  useEffect(() => () => {
    leavePage?.reportOpenPageChanged(ownerRef.current, false);
    leavePage?.unregisterOpenPage(ownerRef.current);
  }, []);

  /* Exported Functions */

  const hasUnsavedChanges = () => isChangedOutsideForm
    || (!!formRef.current?.dirty && !isEqual(formRef.current.values, savedValuesRef.current));

  const markSaved = () => {
    savedValuesRef.current = {...formRef.current?.values};
  };

  /* Internal Functions */

  const discard = () => {
    markSaved();
    if (onDiscard) onDiscard();
    else formRef.current?.resetForm();
  };

  // What holds Save, one line each. isFormInvalid is what holds the page's own Save button, so the field errors count
  // only while it is set.
  const getSaveHeldReasons = () => {
    const pageReason = getSaveHeldReason?.();
    return [...(pageReason ? [pageReason] : []), ...(isFormInvalid ? getErrorMessages(formRef.current) : [])];
  };

  // Every render, so the gate always calls this render's functions
  if (isAsking) {
    leavePage?.registerOpenPage(ownerRef.current, {
      discard: discard,
      getHasUnsavedChanges: hasUnsavedChanges,
      getMessage: getMessage,
      getSaveHeldReasons: getSaveHeldReasons,
      save: save,
    });
  }
  else leavePage?.unregisterOpenPage(ownerRef.current);

  return {hasUnsavedChanges, isFormDirty, isFormInvalid, markSaved, setIsFormDirty, setIsFormInvalid};
};
