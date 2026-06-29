import React, {useRef, useState} from 'react';
import {FlatList, useWindowDimensions, Text, View} from 'react-native';

import {Formik} from 'formik';

import {imageStyles} from '.';
import {IMAGE_PROPERTIES_FORM_NAME} from './images.constants';
import {SwitchWrapper} from '../../shared/ui';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {formStyles, Form, useForm} from '../form';

const ImagePropertiesModal = ({closeModal, image, isReadOnly, isVisible, saveUpdatedImage, setImageToView}) => {
  /* Data Hooks */

  const {showErrors, validateForm} = useForm();
  const {height: windowHeight} = useWindowDimensions();

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

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      headerTitle={'Image Properties'}
      isVisible={isVisible}
      onActionPressed={saveFormAndGo}
      overlayStyleOverride={{height: windowHeight * 0.9}}
      showActionButton={!isReadOnly}
      showCancelButton={false}
      showCloseButton
    >
      <View style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
        <FlatList
          ListFooterComponent={
            <View style={imageStyles.imageBasemapSwitchRow}>
              <View style={imageStyles.imageBasemapSwitchControl}>
                <SwitchWrapper disabled={isReadOnly} onValueChange={setIsAnnotated} value={isAnnotated}/>
              </View>
              <View style={[formStyles.fieldLabelContainer, imageStyles.imageBasemapSwitchLabelContainer]}>
                <Text style={[formStyles.fieldLabel, imageStyles.imageBasemapSwitchLabel]}>Use as Image Basemap?</Text>
              </View>
            </View>
          }
          ListHeaderComponent={
            <Formik
              initialStatus={{formName: IMAGE_PROPERTIES_FORM_NAME}}
              initialValues={image}
              innerRef={formRef}
              onSubmit={() => console.log('Submitting form...')}
              validate={values => validateForm({formName: IMAGE_PROPERTIES_FORM_NAME, values: values})}
            >
              {formProps => (
                <View style={{flex: 1}}>
                  <Form formName={IMAGE_PROPERTIES_FORM_NAME} isReadOnly={isReadOnly} {...formProps}/>
                </View>
              )}
            </Formik>
          }
          bounces={false}
          contentContainerStyle={{paddingBottom: 8}}
          style={{flex: 1, minHeight: 0}}
        />
      </View>
    </ModalWrapper>
  );
};

export default ImagePropertiesModal;
