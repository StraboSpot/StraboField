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
        buttonTitleLeft={'Cancel'}
        buttonTitleRight={'Save'}
        cancel={() => closeModal()}
        closeModal={() => saveImageOverlay(overlayFormRef?.current?.values)}
        title={'Add Image Overlay'}
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
        {!isEmpty(image) && (
          <Button
            onPress={deleteImageOverlayConfirm}
            title={'Remove Image Overlay'}
            titleStyle={{color: WARNING_COLOR}}
            type={'clear'}
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
