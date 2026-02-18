import React, {useRef} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {showFieldInfo, validateImageOverlay} from './sed.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import alert from '../../shared/ui/alert';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {NumberInputField, SelectInputField, useForm} from '../form';
import {setStratSection} from '../maps/maps.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddImageOverlayModal = ({
                                closeModal,
                                image,
                                isReadOnly,
                              }) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);

  const {showErrors} = useForm();

  /* Local State */

  const overlayFormRef = useRef(null);

  /* Event Handlers */

  // Resize image preserving image ratio
  const onMyChange = async (name, value) => {
    const img = spot.properties.images.find(i => i.id === overlayFormRef.current?.values?.id);
    if (value && name === 'image_width') {
      overlayFormRef.current.setFieldValue('image_width', value);
      overlayFormRef.current.setFieldValue('image_height', Math.round(img.height / img.width * value));
    }
    else if (value && name === 'image_height') {
      overlayFormRef.current.setFieldValue('image_height', value);
      overlayFormRef.current.setFieldValue('image_width', Math.round(img.width / img.height * value));
    }
    else if (name === 'image_width' || name === 'image_height') {
      overlayFormRef.current?.setFieldValue('image_height', undefined);
      overlayFormRef.current?.setFieldValue('image_width', undefined);
    }
  };

  /* Logic Helpers */

  const deleteImageOverlay = () => {
    let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
    const editedStratSectionImages = editedSedData.strat_section.images.filter(i => i.id !== image.id);
    if (isEmpty(editedStratSectionImages)) delete editedSedData.strat_section.images;
    else editedSedData.strat_section.images = editedStratSectionImages;
    dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
    dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));

    // Update strat section for map if matches edited strat section
    const stratSectionSettings = editedSedData.strat_section || {};
    if (stratSectionSettings.strat_section_id
      && stratSection?.strat_section_id === stratSectionSettings.strat_section_id) {
      dispatch(setStratSection(stratSectionSettings));
    }

    closeModal();
  };

  const deleteImageOverlayConfirm = () => {
    alert(
      'Remove Image Overlay?',
      'Are you sure you want to remove this image overlay?',
      [{
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      }, {
        text: 'Remove',
        onPress: deleteImageOverlay,
      }],
    );
  };

  const getImageChoices = () => {
    const getImageLabel = (img, i) => (img.title || 'Untitled ' + (i + 1))
      + ' (' + img.width + ' x ' + img.height + ')';

    // Alphabetize images by name
    const sortedImages = spot.properties?.images ? JSON.parse(JSON.stringify(spot.properties.images)).sort(
        (imgA, imgB) => (imgA?.title?.toString() || 'UntitledA').localeCompare(imgB?.title?.toString() || 'UntitledB'))
      : [];

    return sortedImages?.map((img, i) => ({
      label: getImageLabel(img, i),
      value: img.id,
      disabled: isReadOnly,
    })) || [];
  };

  const saveImageOverlay = async () => {
    await overlayFormRef.current.submitForm();
    const editedImageOverlayData = showErrors(overlayFormRef.current);
    // console.log('Image Overlay Data', editedImageOverlayData);
    if (!isEmpty(editedImageOverlayData) && editedImageOverlayData.id) {
      let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
      let editedStratSectionData = editedSedData.strat_section ? JSON.parse(
        JSON.stringify(editedSedData.strat_section)) : {};
      let editedImageOverlaysData = editedStratSectionData.images ? JSON.parse(
        JSON.stringify(editedStratSectionData.images)) : [];
      editedImageOverlaysData = editedImageOverlaysData.filter(i => i.id !== editedImageOverlayData.id);
      editedImageOverlaysData.push(editedImageOverlayData);
      editedStratSectionData = {...editedStratSectionData, images: editedImageOverlaysData};
      editedSedData = {...editedSedData, strat_section: editedStratSectionData};
      dispatch(editedSpotProperties({field: 'sed', value: editedSedData}));

      // Update strat section for map if matches edited strat section
      const stratSectionSettings = editedSedData.strat_section || {};
      if (stratSectionSettings.strat_section_id
        && stratSection?.strat_section_id === stratSectionSettings.strat_section_id) {
        dispatch(setStratSection(stratSectionSettings));
      }
    }
    closeModal();
  };

  /* Render Functions */

  const renderAddImageOverlayModal = () => {
    return (
      <ModalWrapper
        buttonTitleRight={!isReadOnly && 'Save'}
        headerTitle={'Add Image Overlay'}
        onActionPressed={() => isReadOnly ? closeModal() : saveImageOverlay(overlayFormRef?.current?.values)}
        onCancelPress={() => !isReadOnly && closeModal()}
      >
        <Formik
          enableReinitialize={false}
          initialValues={image || {}}
          innerRef={overlayFormRef}
          onSubmit={() => console.log('Submitting form...')}
          validate={validateImageOverlay}
          validateOnChange={false}
        >
          {outerFormProps => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    choices={getImageChoices()}
                    component={formProps =>
                      SelectInputField({
                        setFieldValue: formProps.form.setFieldValue,
                        ...formProps.field,
                        ...formProps,
                      })
                    }
                    key={'id'}
                    label={'Image to Use as Overlay'}
                    name={'id'}
                    single={true}
                  />
                </ListItem.Content>
              </ListItem>
              {outerFormProps.values?.id && (
                <>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'image_origin_x'}
                        label={'Image Origin X Value'}
                        name={'image_origin_x'}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'x value for the bottom left corner of image relative to axes origin (0,0)'}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'image_origin_y'}
                        label={'Image Origin Y Value'}
                        name={'image_origin_y'}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'y value for the bottom left corner of image relative to axes origin (0,0)'}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'image_width'}
                        label={'Adjusted Image Width'}
                        name={'image_width'}
                        onMyChange={onMyChange}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'height adjusted automatically to maintain aspect ratio'}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'image_height'}
                        label={'Adjusted Image Height'}
                        name={'image_height'}
                        onMyChange={onMyChange}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'width adjusted automatically to maintain aspect ratio'}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'image_opacity'}
                        label={'Image Opacity'}
                        name={'image_opacity'}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'0-1 with 0 being transparent and 1 opaque'}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        editable={!isReadOnly}
                        key={'z_index'}
                        label={'Z-Index'}
                        name={'z_index'}
                        onShowFieldInfo={showFieldInfo}
                        placeholder={'layer ordering'}
                      />
                    </ListItem.Content>
                  </ListItem>
                </>
              )}
            </View>
          )}
        </Formik>
        {!isEmpty(image) && !isReadOnly && (
          <DeleteButton onPress={deleteImageOverlayConfirm} title={'Remove Image Overlay'}/>
        )}
      </ModalWrapper>
    );
  };

  /* View */

  return renderAddImageOverlayModal();
};

export default AddImageOverlayModal;
