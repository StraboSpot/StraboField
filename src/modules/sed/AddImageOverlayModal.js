import React, {useRef} from 'react';
import {View} from 'react-native';

import {Button, ListItem} from '@rn-vui/base';
import {Field, Formik} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/Helpers';
import {WARNING_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import ModalWrapper from '../../shared/ui/modal/ModalWrapper';
import {NumberInputField, SelectInputField, useForm} from '../form';
import {setStratSection} from '../maps/maps.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import {editedSpotProperties} from '../spots/spots.slice';

const AddImageOverlayModal = ({
                                closeModal,
                                image,
                              }) => {
  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const stratSection = useSelector(state => state.map.stratSection);

  const {showErrors} = useForm();

  const overlayFormRef = useRef(null);

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
    })) || [];
  };

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

  const renderAddImageOverlayModal = () => {
    return (
      <ModalWrapper
        title={'Add Image Overlay'}
        buttonTitleLeft={'Cancel'}
        buttonTitleRight={'Save'}
        cancel={() => closeModal()}
        closeModal={() => saveImageOverlay(overlayFormRef?.current?.values)}
      >
        <Formik
          initialValues={image || {}}
          onSubmit={() => console.log('Submitting form...')}
          validate={validateImageOverlay}
          validateOnChange={false}
          innerRef={overlayFormRef}
          enableReinitialize={false}
        >
          {outerFormProps => (
            <View>
              <ListItem containerStyle={commonStyles.listItemFormField}>
                <ListItem.Content>
                  <Field
                    component={formProps =>
                      SelectInputField({
                        setFieldValue: formProps.form.setFieldValue,
                        ...formProps.field,
                        ...formProps,
                      })
                    }
                    name={'id'}
                    key={'id'}
                    label={'Image to Use as Overlay'}
                    choices={getImageChoices()}
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
                        name={'image_origin_x'}
                        label={'Image Origin X Value'}
                        key={'image_origin_x'}
                        placeholder={'x value for the bottom left corner of image relative to axes origin (0,0)'}
                        onShowFieldInfo={showFieldInfo}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        name={'image_origin_y'}
                        label={'Image Origin Y Value'}
                        key={'image_origin_y'}
                        placeholder={'y value for the bottom left corner of image relative to axes origin (0,0)'}
                        onShowFieldInfo={showFieldInfo}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        name={'image_width'}
                        label={'Adjusted Image Width'}
                        key={'image_width'}
                        placeholder={'height adjusted automatically to maintain aspect ratio'}
                        onShowFieldInfo={showFieldInfo}
                        onMyChange={onMyChange}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        name={'image_height'}
                        label={'Adjusted Image Height'}
                        key={'image_height'}
                        placeholder={'width adjusted automatically to maintain aspect ratio'}
                        onShowFieldInfo={showFieldInfo}
                        onMyChange={onMyChange}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        name={'image_opacity'}
                        label={'Image Opacity'}
                        key={'image_opacity'}
                        placeholder={'0-1 with 0 being transparent and 1 opaque'}
                        onShowFieldInfo={showFieldInfo}
                      />
                    </ListItem.Content>
                  </ListItem>
                  <ListItem containerStyle={commonStyles.listItemFormField}>
                    <ListItem.Content>
                      <Field
                        component={NumberInputField}
                        name={'z_index'}
                        label={'Z-Index'}
                        key={'z_index'}
                        placeholder={'layer ordering'}
                        onShowFieldInfo={showFieldInfo}
                      />
                    </ListItem.Content>
                  </ListItem>
                </>
              )}
            </View>
          )}
        </Formik>
        {!isEmpty(image) && (
          <Button
            titleStyle={{color: WARNING_COLOR}}
            title={'Remove Image Overlay'}
            type={'clear'}
            onPress={deleteImageOverlayConfirm}
          />
        )}
      </ModalWrapper>
    );
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

  const showFieldInfo = (label, info) => {
    alert(label, info, []);
  };

  const validateImageOverlay = (values) => {
    let errors = {};
    // console.log('Values before image overlay validation:', values);
    if ((values.image_height && !values.image_width) || (values.image_width && !values.image_height)) {
      delete values.image_height;
      delete values.image_width;
    }
    Object.entries(values).forEach(([key, value]) => {
      switch (key) {
        case 'id':
          break;
        case 'image_height':
        case 'image_width':
          if (parseFloat(value) > 0) values[key] = parseFloat(value);
          else {
            delete values.image_height;
            delete values.image_width;
          }
          break;
        case 'image_opacity':
          if (parseFloat(value) < 0 || parseFloat(value) > 1) errors[key] = 'Opacity must be between 0 and 1.';
          else values[key] = parseFloat(value);
          break;
        default:
          if (parseFloat(value)) values[key] = parseFloat(value);
          else delete values[key];
          break;
      }
    });
    // console.log('Values after image overlay validation:', values);
    return errors;
  };

  return renderAddImageOverlayModal();
};

export default AddImageOverlayModal;
