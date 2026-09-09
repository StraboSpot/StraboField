import {useEffect} from 'react';

import {isEmpty} from '../../shared/helpers';

// Formik re-renders only its own children, so a change inside a form is invisible to the page or modal around it.
// Rendered inside one, this validates every change as it happens and reports the result back out, so the messages
// show under the fields right away rather than only when the form is saved. FormikWrapper renders it.
// Validating on every change is also why a validate must leave the values it is given alone: rewriting them here
// would rewrite what is being typed, under the cursor.
const LiveValidation = ({formProps, setInvalidFields, setIsFormInvalid, validate}) => {
  useEffect(() => {
    const errors = validate(formProps.values);
    formProps.setErrors(errors);
    setIsFormInvalid(!isEmpty(errors));
    if (setInvalidFields) setInvalidFields(Object.keys(errors));
  }, [formProps.values]);

  return null;
};

export default LiveValidation;
