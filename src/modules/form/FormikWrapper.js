import React from 'react';

import {Formik} from 'formik';

import LiveValidation from './LiveValidation';
import useForm from './useForm';

// The one place a form is set up. It supplies what every form in the app was repeating - the throwaway onSubmit,
// the survey validation for its formName, and the status an error message needs to name its field from the label
// dictionary rather than by its raw key - and passes everything else through to Formik, where whatever a caller
// gives wins over the defaults set here.
// A formName is what asks for that survey to be validated, so a form that saves whatever is typed leaves it off,
// and one that validates something other than a survey passes its own validate - which, like the survey
// validation, must leave the values it is given alone.
// setIsFormInvalid additionally validates as the user types, so the messages show under the fields right away
// rather than only when the form is saved, and the caller can keep Save from being pressed while any error
// remains. Leave it off for a form with no validation, or one whose validate is really a change handler, which
// must not run a second time for every keystroke.
const FormikWrapper = ({children, formName, setIsFormInvalid, validate, ...props}) => {
  /* Data Hooks */

  const {validateForm} = useForm();

  /* Derived Variables */

  const validateValues = validate
    || (formName ? values => validateForm({formName: formName, values: values}).errors : undefined);

  /* View */

  return (
    <Formik
      initialStatus={{formName: formName}}
      onSubmit={values => console.log('Submitting form' + (formName ? ' ' + formName.join('.') : '') + '...', values)}
      validate={validateValues}
      // LiveValidation is the change-time validator when it is on, so Formik's own pass would only repeat it
      validateOnChange={!setIsFormInvalid}
      {...props}
    >
      {formProps => (
        <>
          {setIsFormInvalid && (
            <LiveValidation formProps={formProps} setIsFormInvalid={setIsFormInvalid} validate={validateValues}/>
          )}
          {typeof children === 'function' ? children(formProps) : children}
        </>
      )}
    </Formik>
  );
};

export default FormikWrapper;
