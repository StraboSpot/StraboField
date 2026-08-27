import React, {useEffect, useRef, useState} from 'react';
import {FlatList, Image, Linking, Pressable, SectionList, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {PAGES_IN_MENU_ORDER, PRIMARY_PAGES, SAMPLE_OVERVIEW_DEFAULT_PAGES} from './page.constants';
import PageHeader from './PageHeader';
import {PAGE_KEYS} from './pageKeys.constants';
import usePage from './usePage';
import RockdLogo from '../../assets/images/logos/rockd-icon-256.png';
import {isEmpty, toTitleCase} from '../../shared/helpers';
import {SMALL_SCREEN, SMALL_TEXT_SIZE, TEXT_WEIGHT_500} from '../../shared/styles.constants';
import {SwitchWrapper} from '../../shared/ui';
import alert from '../../shared/ui/alert';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import SaveAndCancelButtons from '../../shared/ui/buttons/SaveAndCancelButtons';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import uiStyles from '../../shared/ui/ui.styles';
import {Form, FormikWrapper, useForm} from '../form';
import {setModalVisible} from '../home/home.slice';
import {ImageModal, ImagePropertiesModal, useImages} from '../images';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import notebookStyles from '../notebook-panel/notebook.styles';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import SketchModal from '../sketch/SketchModal';
import {useSpots} from '../spots';
import {editedSpotImages, editedSpotProperties} from '../spots/spots.slice';

const Overview = ({isReadOnly, isSample, openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const checkedInSpotIds = useSelector(state => state.user.macrostrat?.checkedInSpotIds ?? []);

  const {submitAndShowErrors} = useForm();
  const {deleteImageFromSpot} = useImages();
  const {getPopulatedPagesKeys} = usePage();
  const {getSpotByImageId} = useSpots();
  const toast = useToast();

  /* Local State */

  const formRef = useRef(null);

  const [imageToView, setImageToView] = useState({});
  const [isFormInvalid, setIsFormInvalid] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);
  const [shouldOpenImageProperties, setShouldOpenImageProperties] = useState(false);
  const [sketchImage, setSketchImage] = useState({});
  const [isTraceSurfaceFeatureEdit, setIsTraceSurfaceFeatureEdit] = useState(false);
  const [isTraceSurfaceFeatureEnabled, setIsTraceSurfaceFeatureEnabled] = useState(false);
  const isTestingMode = useSelector(state => state.project.isTestingMode);

  /* Derived Variables */

  const defaultPagesKeys = spot.properties?.isSample ? SAMPLE_OVERVIEW_DEFAULT_PAGES : PRIMARY_PAGES.map(p => p.key);
  const visiblePagesKeys = [...new Set([...defaultPagesKeys, ...getPopulatedPagesKeys(spot)])];
  // List the sections in the same order as the notebook's More Pages menu, except on a sample, where
  // Samples leads
  const orderedPages = spot.properties?.isSample ? [...PAGES_IN_MENU_ORDER.filter(p => p.key === PAGE_KEYS.SAMPLES),
      ...PAGES_IN_MENU_ORDER.filter(p => p.key !== PAGE_KEYS.SAMPLES)]
    : PAGES_IN_MENU_ORDER;
  const sections = orderedPages.reduce((acc, page) => {
    if (visiblePagesKeys.includes(page.key) && page.overview_component) {
      const sectionOverview = {title: page, data: [page]};
      return [...acc, sectionOverview];
    }
    else return acc;
  }, []);

  /* Side Effects */

  useEffect(() => {
    console.log('UE Overview [spot]', spot);
    setIsTraceSurfaceFeatureEnabled(!!(spot.properties.trace?.trace_feature || spot.properties.surface_feature));
    setIsTraceSurfaceFeatureEdit(false);
    setIsImageModalVisible(false);
    setIsImagePropertiesModalVisible(false);
    setShouldOpenImageProperties(false);
    setImageToView({});
  }, [spot]);

  /* Event Handlers */

  const handleCloseImageModal = (isVisible) => {
    setIsImageModalVisible(isVisible);
    if (!isVisible) setShouldOpenImageProperties(false);
  };

  const handleOpenImage = (image) => {
    setShouldOpenImageProperties(false);
    setImageToView(image);
    setIsImageModalVisible(true);
  };

  // Opening properties from an image card: on small screens show only the standalone properties modal
  // so the viewer isn't a throwaway host that flashes before the fullscreen properties modal covers
  // it. On larger screens open the viewer and let it auto-open its nested properties modal (which
  // stacks reliably over the viewer's modal on iOS, where sibling modals don't).
  const handleOpenImageProperties = (image) => {
    setImageToView(image);
    if (SMALL_SCREEN) setIsImagePropertiesModalVisible(true);
    else {
      setShouldOpenImageProperties(true);
      setIsImageModalVisible(true);
    }
  };

  const handleOpenSketch = (image) => {
    setIsImageModalVisible(false);
    setSketchImage(image);
    setIsSketchModalVisible(true);
  };

  const handleToggleShowTraceSurfaceFeatureForm = () => {
    if (isTraceSurfaceFeatureEdit) setIsTraceSurfaceFeatureEdit(false);
    else setIsTraceSurfaceFeatureEdit(true);
  };

  // What happens after submitting the form is handled in saveFormAndGo since we want to show
  // an alert message if there are errors but this function won't be called if form is invalid
  const onSubmitForm = () => {
    console.log('In onSubmitForm');
  };

  /* Logic Helpers */

  const cancelFormAndGo = () => {
    setIsTraceSurfaceFeatureEdit(false);
    if (isTraceSurfaceFeatureEnabled && !spot.properties.trace && !spot.properties.surface_feature) {
      setIsTraceSurfaceFeatureEnabled(false);
    }
  };

  const deleteImage = async image => await deleteImageFromSpot(image.id, getSpotByImageId(image.id));

  const openPage = (page) => {
    dispatch(setNotebookPageVisible(page.key));
    if (page.modal) dispatch(setModalVisible({modal: page.modal}));
    else dispatch(setModalVisible({modal: null}));
  };

  const openRockdLink = () => {
    const checkinId = spot.properties.rockd_checkin_id;
    Linking.openURL(`https://dev.rockd.org/checkin/${checkinId}`);
  };

  const saveForm = async () => {
    try {
      const {values: formValues} = await submitAndShowErrors(formRef.current);
      console.log('Saving form data to Spot ...');
      if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString') {
        const traceValues = {...formValues, 'trace_feature': true};
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'trace', value: traceValues}));
      }
      else if (spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon'
        || spot.geometry.type === 'GeometryCollection') {
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: 'surface_feature', value: formValues}));
      }
      return Promise.resolve();
    }
    catch (err) {
      console.error('Error submitting form', err);
      return Promise.reject();
    }
  };

  const saveFormAndGo = () => {
    saveForm().then(() => {
      setIsTraceSurfaceFeatureEdit(false);
    }, () => {
      console.error('Error saving form data to Spot');
    });
  };

  const saveImagesToSpot = (newImages) => {
    dispatch(updatedModifiedTimestampsBySpotsIds([spot?.properties?.id]));
    dispatch(editedSpotImages(newImages));
    toast.show(`${newImages.length} image(s) saved!`, {type: 'success', duration: 1500});
  };

  const saveUpdatedImage = (updatedImage) => {
    const images = spot?.properties?.images || [];
    const updatedImages = images.map(i => i.id === updatedImage.id ? updatedImage : i);
    dispatch(updatedModifiedTimestampsBySpotsIds([spot?.properties?.id]));
    dispatch(editedSpotProperties({field: 'images', value: updatedImages}));
  };

  const toggleTraceSurfaceFeature = () => {
    const continueToggleTraceSurfaceFeature = () => {
      setIsTraceSurfaceFeatureEnabled(!isTraceSurfaceFeatureEnabled);
      setIsTraceSurfaceFeatureEdit(!isTraceSurfaceFeatureEnabled);

      // If toggled off remove trace or surface feature
      if (isTraceSurfaceFeatureEnabled) {
        let field = 'surface_feature';
        if (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString') field = 'trace';
        dispatch(updatedModifiedTimestampsBySpotsIds([spot.properties.id]));
        dispatch(editedSpotProperties({field: field, value: {}}));
      }
    };

    if (isTraceSurfaceFeatureEnabled && ((spot.properties.trace
        && !isEmpty(Object.keys(spot.properties.trace).filter(t => t !== 'trace_feature')))
      || spot.properties.surface_feature)) {
      let featureTypeText = spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString'
        ? 'Trace' : 'Surface';
      alert('Turn Off ' + featureTypeText + ' Feature Warning',
        'Turning off ' + featureTypeText.toLowerCase() + ' feature will delete all '
        + featureTypeText.toLowerCase() + ' feature data. Are you sure you want to continue?',
        [
          {text: 'No', style: 'cancel'},
          {text: 'Yes', onPress: continueToggleTraceSurfaceFeature},
        ],
        {cancelable: false},
      );
    }
    else continueToggleTraceSurfaceFeature();
  };

  /* Render Functions */

  const renderSectionHeader = (page) => {
    if (page.testing && !isTestingMode) return null;
    else if (spot.properties?.isSample && page.key === PAGE_KEYS.SAMPLES) return null;
    const dividerText = spot.properties.isSample ? 'Sample ' + page.label : page.label;
    return (
      <Pressable onPress={() => openPage(page)} style={uiStyles.sectionHeaderBackground}>
        <SectionDivider
          dividerText={dividerText}
          leftIcon={page.icon_src && <Image source={page.icon_src} style={{height: 18, width: 18}}/>}
        />
      </Pressable>
    );
  };

  const renderRockdBadge = () => {
    if (!checkedInSpotIds.includes(spot.properties.id)) return null;
    return (
      <Pressable
        onPress={openRockdLink}
        style={({pressed}) => [
          {opacity: pressed ? 0.3 : 1, backgroundColor: '#F5F5F5', borderRadius: 10},
        ]}
      >
        <View style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 10,
          paddingVertical: 10,
        }}>
          <Image resizeMode={'contain'} source={RockdLogo} style={{height: 30, width: 30}}/>
          <Text
            style={{fontSize: SMALL_TEXT_SIZE, fontWeight: TEXT_WEIGHT_500}}
          >
            Checked in to Rockd (press to view)
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderSections = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader hideBackButton pageTitle={spot.properties?.isSample ? 'Overview' : 'Spot Overview'}/>
        <SectionList
          ItemSeparatorComponent={FlatListItemSeparator}
          ListHeaderComponent={isTestingMode && renderRockdBadge}
          keyExtractor={item => item.key}
          renderItem={({item}) => {
            if (item.testing && !isTestingMode) return null;
            const SectionOverview = item.overview_component;
            return (
              <SectionOverview
                isReadOnly={isReadOnly}
                onOpenImage={handleOpenImage}
                onOpenImageProperties={handleOpenImageProperties}
                openMainMenuPanel={openMainMenuPanel}
                page={item}
              />
            );
          }}
          renderSectionHeader={({section: {title}}) => renderSectionHeader(title)}
          sections={sections}
          stickySectionHeadersEnabled={true}
        />
      </View>
    );
  };

  const renderTraceSurfaceFeatureForm = () => {
    const formName = spot.geometry && (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
      ? ['general', 'trace'] : ['general', 'surface_feature'];
    const pageTitle = toTitleCase(formName[1].replace('_', ' '));
    let initialValues = spot.properties.trace || spot.properties.surface_feature || {};
    if (spot.geometry && (spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')) {
      initialValues = {...initialValues, 'trace_feature': true};
    }
    return (
      <View style={{flex: 1}}>
        <PageHeader hideBackButton pageTitle={pageTitle}/>
        {!isReadOnly && (
          <SaveAndCancelButtons cancel={cancelFormAndGo} getIsDisabled={isFormInvalid} save={saveFormAndGo}/>
        )}
        <FlatList
          ListHeaderComponent={
            <FormikWrapper
              enableReinitialize={true}
              formName={formName}
              initialValues={initialValues}
              innerRef={formRef}
              onSubmit={onSubmitForm}
              setIsFormInvalid={setIsFormInvalid}
            >
              {formProps => <Form {...formProps} formName={formName} isReadOnly={isReadOnly}/>}
            </FormikWrapper>
          }
        />
      </View>
    );
  };

  /* View */

  return (
    <View style={{flex: 1}}>
      {!isSample && spot.geometry && spot.geometry.type && (spot.geometry.type === 'LineString'
        || spot.geometry.type === 'MultiLineString' || spot.geometry.type === 'Polygon'
        || spot.geometry.type === 'MultiPolygon' || spot.geometry.type === 'GeometryCollection') && (
        <View style={notebookStyles.traceSurfaceFeatureContainer}>
          <View style={notebookStyles.traceSurfaceFeatureToggleContainer}>
            {(spot.geometry.type === 'LineString' || spot.geometry.type === 'MultiLineString')
              && <Text style={notebookStyles.traceSurfaceFeatureToggleText}>This is a trace feature</Text>}
            {(spot.geometry.type === 'Polygon' || spot.geometry.type === 'MultiPolygon'
                || spot.geometry.type === 'GeometryCollection')
              && <Text style={notebookStyles.traceSurfaceFeatureToggleText}>This is a surface feature</Text>}
            <SwitchWrapper
              disabled={isReadOnly}
              onValueChange={toggleTraceSurfaceFeature}
              value={isTraceSurfaceFeatureEnabled}
            />
          </View>
          <View style={{height: 40}}>
            {(isReadOnly || !isTraceSurfaceFeatureEdit) && (
              <ClearButton
                disabled={!isTraceSurfaceFeatureEnabled}
                onPress={handleToggleShowTraceSurfaceFeatureForm}
                title={isTraceSurfaceFeatureEdit ? 'Close' : isReadOnly ? 'View' : 'Edit'}
              />
            )}
          </View>
        </View>
      )}
      {isTraceSurfaceFeatureEdit ? renderTraceSurfaceFeatureForm() : renderSections()}

      {/* Modals */}
      <ImageModal
        deleteImage={deleteImage}
        image={imageToView}
        isReadOnly={isReadOnly}
        isVisible={isImageModalVisible}
        onOpenSketch={handleOpenSketch}
        saveUpdatedImage={saveUpdatedImage}
        setImageToView={setImageToView}
        setIsImageModalVisible={handleCloseImageModal}
        shouldOpenProperties={shouldOpenImageProperties}
      />
      {isImagePropertiesModalVisible && (
        <ImagePropertiesModal
          closeModal={() => setIsImagePropertiesModalVisible(false)}
          image={imageToView}
          isReadOnly={isReadOnly}
          isVisible={isImagePropertiesModalVisible}
          saveUpdatedImage={saveUpdatedImage}
          setImageToView={setImageToView}
        />
      )}
      {isSketchModalVisible && (
        <SketchModal
          image={sketchImage}
          saveImages={saveImagesToSpot}
          saveUpdatedImage={saveUpdatedImage}
          setIsSketchModalVisible={setIsSketchModalVisible}
        />
      )}
    </View>
  );
};

export default Overview;
