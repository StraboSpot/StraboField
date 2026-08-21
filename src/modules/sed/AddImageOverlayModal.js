import React, {useRef, useState} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {validateImageOverlay} from './sed.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import {NumberInputField, SelectInputField, useForm} from '../form';
import FieldInfoModal from '../form/FieldInfoModal';
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

  const {submitAndShowErrors} = useForm();

  /* Local State */

  const overlayFormRef = useRef(null);

  const [fieldInfo, setFieldInfo] = useState(null);

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
    const {values: editedImageOverlayData} = await submitAndShowErrors(overlayFormRef.current);
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
        headerTitle={'Add Image Overlay'}
        onActionPressed={saveImageOverlay}
        onCancelPress={closeModal}
        onDeletePress={deleteImageOverlayConfirm}
        showActionButton={!isReadOnly}
        showDeleteButton={!isEmpty(image) && !isReadOnly}
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
                  <Field key={'id'} name={'id'}>
                    {({field, form}) => (
                      <SelectInputField
                        {...field}
                        choices={getImageChoices()}
                        errors={form.errors}
                        label={'Image to Use as Overlay'}
                        setFieldValue={form.setFieldValue}
                        single={true}
                      />
                    )}
                  </Field>
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
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
                        onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
                        placeholder={'layer ordering'}
                      />
                    </ListItem.Content>
                  </ListItem>
                </>
              )}
            </View>
          )}
        </Formik>

        {/* Modal */}
        <FieldInfoModal fieldInfo={fieldInfo} onClose={() => setFieldInfo(null)}/>
      </ModalWrapper>
    );
  };

  /* View */

  return renderAddImageOverlayModal();
};

export default AddImageOverlayModal;
