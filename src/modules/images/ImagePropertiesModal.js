import React, {useRef, useState} from 'react';
import {FlatList, Switch, Text, View} from 'react-native';

import {Formik} from 'formik';

import {imageStyles} from '.';
import Modal from '../../shared/ui/modal/Modal';
import {Form, useForm} from '../form';

const ImagePropertiesModal = ({closeModal, image, saveUpdatedImage, setImageToView}) => {

  const [isAnnotated, setIsAnnotated] = useState(image.annotated);

  const {showErrors, validateForm} = useForm();

  const formRef = useRef(null);

  const renderFormFields = () => {
    const formName = ['general', 'images'];
    console.log('Rendering form:', formName.join('.'), 'with selected image:', image);
    return (
      <Formik
        innerRef={formRef}
        onSubmit={() => console.log('Submitting form...')}
        validate={values => validateForm({formName: formName, values: values})}
        component={formProps => Form({formName: formName, ...formProps})}
        initialValues={image}
        initialStatus={{formName: formName}}
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
    <Modal
      buttonTitleLeft={'Cancel'}
      buttonTitleRight={'Save'}
      cancel={closeModal}
      closeModal={saveFormAndGo}
      title={'Image Properties'}
    >
      <FlatList
        ListHeaderComponent={renderFormFields()}
        ListFooterComponent={
          <View style={imageStyles.switch}>
            <Text style={{marginLeft: 10, fontSize: 16}}>Use as Image Basemap?</Text>
            <Switch onValueChange={setIsAnnotated} value={isAnnotated}/>
          </View>
        }
      />
    </Modal>
  );
};

export default ImagePropertiesModal;
