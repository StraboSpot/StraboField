import React, {useRef, useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {Formik} from 'formik';

import {imageStyles} from '.';
import {SwitchWrapper} from '../../shared/ui';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {Form, useForm} from '../form';

const ImagePropertiesModal = ({closeModal, image, isReadOnly, saveUpdatedImage, setImageToView}) => {

  const [isAnnotated, setIsAnnotated] = useState(image.annotated);

  const {showErrors, validateForm} = useForm();

  const formRef = useRef(null);

  const renderFormFields = () => {
    const formName = ['general', 'images'];
    console.log('Rendering form:', formName.join('.'), 'with selected image:', image);
    return (
      <Formik
        component={formProps => Form({formName: formName, isReadOnly: isReadOnly, ...formProps})}
        initialStatus={{formName: formName}}
        initialValues={image}
        innerRef={formRef}
        onSubmit={() => console.log('Submitting form...')}
        validate={values => validateForm({formName: formName, values: values})}
      />
    );
  };

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

  return (
    <ModalWrapper
      buttonTitleLeft={!isReadOnly && 'Cancel'}
      buttonTitleRight={!isReadOnly && 'Save'}
      cancel={closeModal}
      closeModal={isReadOnly ? closeModal : saveFormAndGo}
      title={'Image Properties'}
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
    </ModalWrapper>
  );
};

export default ImagePropertiesModal;
