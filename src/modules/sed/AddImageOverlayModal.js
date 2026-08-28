import React, {useRef, useState} from 'react';
import {View} from 'react-native';

import {ListItem} from '@rn-vui/base';
import {Field} from 'formik';
import {useDispatch, useSelector} from 'react-redux';

import {IMAGE_OVERLAY_SIZE_KEYS, Y_MULTIPLIER} from './sed.constants';
import {getCleanedImageOverlay, validateImageOverlay} from './sed.helpers';
import commonStyles from '../../shared/common.styles';
import {isEmpty} from '../../shared/helpers';
import alert from '../../shared/ui/alert';
import OutlineButton from '../../shared/ui/buttons/OutlineButton';
import ModalWrapper from '../../shared/ui/modals/ModalWrapper';
import SectionDivider from '../../shared/ui/SectionDivider';
import {FormikWrapper, NumberInputField, SelectInputField, useForm} from '../form';
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
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  /* Derived Variables */

  const isNewOverlay = isEmpty(image);
  // A new overlay is drawn fully opaque, so start its field at 1 rather than leave it empty and have the value
  // that gets drawn come from a fallback the user cannot see
  const initialOverlayValues = isNewOverlay ? {image_opacity: 1} : image;
  // The y-axis is drawn at Y_MULTIPLIER pixels to one unit of whatever the section counts in, which is the
  // section's own setting rather than always meters - an interval thickness is plotted as typed, with nothing
  // converting between units, so the same ratio holds whichever one is chosen. Older sections may name none.
  const yAxisUnits = spot.properties?.sed?.strat_section?.column_y_axis_units;
  const yAxisScale = Y_MULTIPLIER + ' pixels to 1 ' + (yAxisUnits || 'unit');

  /* Event Handlers */

  // Width and height are a pair, so whichever one is typed sets the other to keep the image's proportions. A value
  // that is not a positive number yet - a lone minus sign or decimal point on the way to one - has no ratio to
  // scale by, so the other side waits for the keystroke that gives it one rather than being filled in with NaN.
  const onMyChange = (name, value) => {
    const formCurrent = overlayFormRef.current;
    formCurrent.setFieldValue(name, value);
    const originalImage = getOriginalImage(formCurrent?.values?.id);
    const number = parseFloat(value);
    if (!originalImage || !(number > 0)) return;
    const [otherKey, ratio] = name === 'image_width' ? ['image_height', originalImage.height / originalImage.width]
      : ['image_width', originalImage.width / originalImage.height];
    formCurrent.setFieldValue(otherKey, Math.round(ratio * number));
  };

  const onUseOriginalSizePressed = () => {
    IMAGE_OVERLAY_SIZE_KEYS.forEach(key => overlayFormRef.current?.setFieldValue(key, undefined));
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

  // The image the overlay draws, which is gone if it has since been deleted from the Spot
  const getOriginalImage = id => spot.properties?.images?.find(i => i.id === id);

  // A reading off the y-axis in the section's own units, or pointed at the axis where the section names none,
  // which avoids '30 unit'. That fallback is already a whole phrase, so the noun a sentence would put after the
  // amount is only appended when there are units to carry it.
  const getYAxisAmount = (amount, ofWhat = '') => yAxisUnits ? amount + ' ' + yAxisUnits + ofWhat
    : amount + ' on the y-axis';

  const saveImageOverlay = async () => {
    const {values: overlayFormValues} = await submitAndShowErrors(overlayFormRef.current);
    const editedImageOverlayData = getCleanedImageOverlay(overlayFormValues);
    // console.log('Image Overlay Data', editedImageOverlayData);
    if (!isEmpty(editedImageOverlayData) && editedImageOverlayData.id) {
      let editedSedData = spot.properties.sed ? JSON.parse(JSON.stringify(spot.properties.sed)) : {};
      let editedStratSectionData = editedSedData.strat_section ? JSON.parse(
        JSON.stringify(editedSedData.strat_section)) : {};
      let editedImageOverlaysData = editedStratSectionData.images ? JSON.parse(
        JSON.stringify(editedStratSectionData.images)) : [];
      // Pointing an overlay at an image that already has one would leave the list with two of that image, so any
      // other overlay of the chosen image goes first - before the place to save into is found, since dropping one
      // that sits earlier in the list shifts that place up.
      editedImageOverlaysData = editedImageOverlaysData.filter(
        i => i.id === image?.id || i.id !== editedImageOverlayData.id);
      // Save the overlay back into the place it already had, so the list stays in the order the user left it in
      // rather than sending whichever one was just edited to the bottom. Which entry that is comes from the overlay
      // the modal was opened on - the image an overlay draws can be changed, so the saved id does not identify it.
      const editedIndex = editedImageOverlaysData.findIndex(i => i.id === image?.id);
      if (editedIndex === -1) editedImageOverlaysData.push(editedImageOverlayData);
      else editedImageOverlaysData.splice(editedIndex, 1, editedImageOverlayData);
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

  const renderAppearanceSection = () => {
    return (
      <>
        <SectionDivider dividerText={'Appearance'}/>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              isNegativeAllowed={false}
              key={'image_opacity'}
              label={'Opacity'}
              name={'image_opacity'}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'Between 0 and 1, where 0 is invisible and 1 is solid.'}
            />
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              key={'z_index'}
              label={'Draw Order'}
              name={'z_index'}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'A higher number is drawn over a lower one.'}
            />
          </ListItem.Content>
        </ListItem>
      </>
    );
  };

  const renderPositionSection = () => {
    return (
      <>
        <SectionDivider
          dividerText={'Position'}
          subtitle={'Where the bottom left corner of the image sits, in pixels from the (0,0) origin where the axes'
            + ' cross. The y-axis runs ' + yAxisScale + ', so to start the image at ' + getYAxisAmount(5)
            + ', enter a Y of ' + 5 * Y_MULTIPLIER + '.'}
        />
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              key={'image_origin_x'}
              label={'Origin X (pixels)'}
              name={'image_origin_x'}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'Positive moves the image right of the y-axis, negative moves it left.'}
            />
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              key={'image_origin_y'}
              label={'Origin Y (pixels)'}
              name={'image_origin_y'}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'Positive moves the image up from the x-axis, negative moves it down.'}
            />
          </ListItem.Content>
        </ListItem>
      </>
    );
  };

  const renderSizeSection = (originalImage) => {
    const originalSizeText = originalImage && originalImage.width + ' x ' + originalImage.height + ' pixels';
    return (
      <>
        <SectionDivider
          dividerText={'Size'}
          subtitle={'Enter a width or a height and the other follows, keeping the image\'s proportions. Leave both'
            + ' empty to draw the image at its own size'
            + (originalSizeText ? ' of ' + originalSizeText + '.' : '.')
            + ' The same ' + yAxisScale + ' applies here, so to show ' + getYAxisAmount(30, ' of the section')
            + ', enter a height of ' + 30 * Y_MULTIPLIER + '.'}
        />
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              isNegativeAllowed={false}
              key={'image_width'}
              label={'Width (pixels)'}
              name={'image_width'}
              onMyChange={onMyChange}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'Must be greater than 0. The height changes with it to keep the image\'s proportions.'}
            />
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={commonStyles.listItemFormField}>
          <ListItem.Content>
            <Field
              component={NumberInputField}
              editable={!isReadOnly}
              isNegativeAllowed={false}
              key={'image_height'}
              label={'Height (pixels)'}
              name={'image_height'}
              onMyChange={onMyChange}
              onShowFieldInfo={(label, info) => setFieldInfo({label, info})}
              placeholder={'Must be greater than 0. The width changes with it to keep the image\'s proportions.'}
            />
          </ListItem.Content>
        </ListItem>
        {!isReadOnly && (
          <OutlineButton
            onPress={onUseOriginalSizePressed}
            title={'Use Original Size' + (originalSizeText ? ' (' + originalSizeText + ')' : '')}
          />
        )}
      </>
    );
  };

  /* View */

  return (
    <ModalWrapper
      disabled={isFormInvalid}
      headerTitle={isNewOverlay ? 'Add Image Overlay' : 'Edit Image Overlay'}
      onActionPressed={saveImageOverlay}
      onCancelPress={closeModal}
      onDeletePress={deleteImageOverlayConfirm}
      showActionButton={!isReadOnly}
      showDeleteButton={!isNewOverlay && !isReadOnly}
    >
      <FormikWrapper
        enableReinitialize={false}
        initialValues={initialOverlayValues}
        innerRef={overlayFormRef}
        setIsFormInvalid={setIsFormInvalid}
        validate={validateImageOverlay}
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
                      isRequired={true}
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
                {renderPositionSection()}
                {renderSizeSection(getOriginalImage(outerFormProps.values.id))}
                {renderAppearanceSection()}
              </>
            )}
          </View>
        )}
      </FormikWrapper>

      {/* Modal */}
      <FieldInfoModal fieldInfo={fieldInfo} onClose={() => setFieldInfo(null)}/>
    </ModalWrapper>
  );
};

export default AddImageOverlayModal;
