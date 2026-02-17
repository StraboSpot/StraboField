import React, {useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Formik} from 'formik';

import {imageStyles} from '.';
import {IMAGE_PROPERTIES_FORM_NAME} from './images.constants';
import {SwitchWrapper} from '../../shared/ui';
import ActionButton from '../../shared/ui/buttons/ActionButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';

const ImagePropertiesModal = ({closeModal, image, isReadOnly, isVisible, saveUpdatedImage, setImageToView}) => {
  /* Data Hooks */

  const {showErrors, validateForm} = useForm();

  /* Local State */

  const formRef = useRef(null);

  const [isAnnotated, setIsAnnotated] = useState(image.annotated);

  /* Logic Helpers */

  const saveFormAndGo = async () => {
    try {
      await formRef.current.submitForm();
      let formValues = showErrors(formRef.current);
      if (isAnnotated) formValues = {...formValues, annotated: isAnnotated};
      else if (formValues.annotated) delete formValues.annotated;
      setImageToView(formValues);
      saveUpdatedImage(formValues);
      closeModal();
      return Promise.resolve();
    }
    catch (e) {
      console.log('Error submitting form', e);
      return Promise.reject();
    }
  };

  /* Render Functions */

  const renderFormFields = () => {
    console.log('Rendering form:', IMAGE_PROPERTIES_FORM_NAME.join('.'), 'with selected image:', image);
    return (
      <Formik
        component={formProps => Form({formName: IMAGE_PROPERTIES_FORM_NAME, isReadOnly: isReadOnly, ...formProps})}
        initialStatus={{formName: IMAGE_PROPERTIES_FORM_NAME}}
        initialValues={image}
        innerRef={formRef}
        onSubmit={() => console.log('Submitting form...')}
        validate={values => validateForm({formName: IMAGE_PROPERTIES_FORM_NAME, values: values})}
      />
    );
  };

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerTitle={'Image Properties'}
      isVisible={isVisible}
      onActionPressed={saveFormAndGo}
      overlayStylesOverride={{height: '90%'}}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton
    >
      <FlatList
        ListFooterComponent={
          <View style={imageStyles.switch}>
            <Text style={{marginLeft: 10, fontSize: 16}}>Use as Image Basemap?</Text>
            <SwitchWrapper disabled={isReadOnly} onValueChange={setIsAnnotated} value={isAnnotated}/>
          </View>
        }
        ListHeaderComponent={renderFormFields()}
      />
      {!isReadOnly && <ActionButton onPress={saveFormAndGo}/>}
    </ModalWrapper>
  );
};

export default ImagePropertiesModal;
