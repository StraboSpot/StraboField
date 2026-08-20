import React, {useRef, useState} from 'react';
import {FlatList, Platform, useWindowDimensions, Text, View} from 'react-native';

import {Formik} from 'formik';

import {imageStyles} from '.';
import {IMAGE_PROPERTIES_FORM_NAME} from './images.constants';
import {SMALL_SCREEN} from '../../shared/styles.constants';
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
    catch (err) {
      console.error('Error submitting form', err);
      return Promise.reject();
    }
  };

  /* Render Functions */

  const renderForm = isInline => (
    <Formik
      initialStatus={{formName: IMAGE_PROPERTIES_FORM_NAME}}
      initialValues={image}
      innerRef={formRef}
      onSubmit={() => console.log('Submitting form...')}
      validate={values => validateForm({formName: IMAGE_PROPERTIES_FORM_NAME, values: values})}
    >
      {formProps => <Form formName={IMAGE_PROPERTIES_FORM_NAME} isReadOnly={isReadOnly}
                          renderInline={isInline} {...formProps}/>}
    </Formik>
  );

  const renderBasemapSwitch = () => (
    <View style={imageStyles.imageBasemapSwitchRow}>
      <View style={imageStyles.imageBasemapSwitchControl}>
        <SwitchWrapper disabled={isReadOnly} onValueChange={setIsAnnotated} value={isAnnotated}/>
      </View>
      <View style={[formStyles.fieldLabelContainer, imageStyles.imageBasemapSwitchLabelContainer]}>
        <Text style={[formStyles.fieldLabel, imageStyles.imageBasemapSwitchLabel]}>Use as Image Basemap?</Text>
      </View>
    </View>
  );

  /* View */

  return (
    <ModalWrapper
      closeModal={closeModal}
      // On large-screen native (iPad) render as a plain view overlay instead of the rn-vui Overlay,
      // whose built-in KeyboardAvoidingView pushes the whole modal up when the keyboard opens (hiding
      // the top/focused field). Without it, the modal stays put and the form's keyboard-aware FlatList
      // scrolls the focused field above the keyboard. Small screens keep their full-screen modal path.
      doesRenderAsView={Platform.OS !== 'web' && !SMALL_SCREEN}
      headerTitle={'Image Properties'}
      isVisible={isVisible}
      onActionPressed={saveFormAndGo}
      overlayStyleOverride={{height: windowHeight * 0.9}}
      showActionButton={!isReadOnly}
      showCancelButton={false}
      showCloseButton
    >
      {/* Web has no scroll container of its own, so wrap the form in a bounded, scrollable FlatList.
       On native, render the fields inline so ModalWrapper's keyboard-aware FlatList is the single
       scroll container — nesting FlatLists breaks iOS scroll-to-focused-input (the focused field
       scrolls out of view instead of just above the keyboard). */}
      {Platform.OS === 'web' ? (
        <View style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
          <FlatList
            ListFooterComponent={renderBasemapSwitch()}
            ListHeaderComponent={renderForm(false)}
            bounces={false}
            contentContainerStyle={{paddingBottom: 8}}
            style={{flex: 1, minHeight: 0}}
          />
        </View>
      ) : (
        <>
          {renderForm(true)}
          {renderBasemapSwitch()}
        </>
      )}
    </ModalWrapper>
  );
};

export default ImagePropertiesModal;
