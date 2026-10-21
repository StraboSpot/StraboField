import React, {useEffect, useState} from 'react';
import {Image, Linking, Pressable, SectionList, Text, View} from 'react-native';

import {useToast} from 'react-native-toast-notifications';
import {useDispatch, useSelector} from 'react-redux';

import {getOverviewSections} from './page.helpers';
import PageHeader from './PageHeader';
import {PAGE_KEYS} from './pageKeys.constants';
import usePage from './usePage';
import RockdLogo from '../../assets/images/logos/rockd-icon-256.png';
import {SMALL_SCREEN, SMALL_TEXT_SIZE, TEXT_WEIGHT_500} from '../../shared/styles.constants';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import SectionDivider from '../../shared/ui/SectionDivider';
import uiStyles from '../../shared/ui/ui.styles';
import {setModalVisible} from '../home/home.slice';
import ImageModal from '../images/ImageModal';
import ImagePropertiesModal from '../images/ImagePropertiesModal';
import useImages from '../images/useImages';
import {setNotebookPageVisible} from '../notebook-panel/notebook.slice';
import {updatedModifiedTimestampsBySpotsIds} from '../project/projects.slice';
import SketchModal from '../sketch/SketchModal';
import {isLineSpot, isPolygonSpot} from '../spots/spots.helpers';
import {editedSpotImages, editedSpotProperties} from '../spots/spots.slice';
import useSpots from '../spots/useSpots';
import {getTraceSurfaceFeatureLabel} from '../trace-surface-feature/traceSurfaceFeature.helpers';
import TraceSurfaceFeatureOverview from '../trace-surface-feature/TraceSurfaceFeatureOverview';
import TraceSurfaceFeaturePage from '../trace-surface-feature/TraceSurfaceFeaturePage';

const Overview = ({isReadOnly, isSample, openMainMenuPanel}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const spot = useSelector(state => state.spot.selectedSpot);
  const checkedInSpotIds = useSelector(state => state.user.macrostrat?.checkedInSpotIds ?? []);

  const {deleteImageFromSpot} = useImages();
  const {getPopulatedPagesKeys} = usePage();
  const {getSpotByImageId} = useSpots();
  const toast = useToast();

  /* Local State */

  const [imageToView, setImageToView] = useState({});
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isImagePropertiesModalVisible, setIsImagePropertiesModalVisible] = useState(false);
  const [isSketchModalVisible, setIsSketchModalVisible] = useState(false);
  const [shouldOpenImageProperties, setShouldOpenImageProperties] = useState(false);
  const [sketchImage, setSketchImage] = useState({});
  const [isTraceSurfaceFeatureEdit, setIsTraceSurfaceFeatureEdit] = useState(false);
  const isTestingMode = useSelector(state => state.project.isTestingMode);

  /* Derived Variables */

  // Not a notebook page: it opens a subpage within the Overview, so it has no icon or More Menu listing
  const traceSurfaceFeatureSection = {key: 'trace_surface_feature', label: getTraceSurfaceFeatureLabel(spot)};
  const sections = [
    ...!isSample && (isLineSpot(spot) || isPolygonSpot(spot))
      ? [{title: traceSurfaceFeatureSection, data: [traceSurfaceFeatureSection]}]
      : [],
    ...getOverviewSections(getPopulatedPagesKeys(spot), spot.properties?.isSample),
  ];

  /* Side Effects */

  useEffect(() => {
    console.log('UE Overview [spot]', spot);
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

  /* Logic Helpers */

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

  /* Render Functions */

  const renderSectionHeader = (page) => {
    if (page.testing && !isTestingMode) return null;
    else if (spot.properties?.isSample && page.key === PAGE_KEYS.SAMPLES) return null;
    const dividerText = spot.properties.isSample ? 'Sample ' + page.label : page.label;
    const onPress = page.key === traceSurfaceFeatureSection.key
      ? () => setIsTraceSurfaceFeatureEdit(true)
      : () => openPage(page);
    return (
      <Pressable onPress={onPress} style={uiStyles.sectionHeaderBackground}>
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
            if (item.key === traceSurfaceFeatureSection.key) {
              return <TraceSurfaceFeatureOverview onPress={() => setIsTraceSurfaceFeatureEdit(true)}/>;
            }
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

  /* View */

  return (
    <View style={{flex: 1}}>
      {isTraceSurfaceFeatureEdit
        ? <TraceSurfaceFeaturePage closePage={() => setIsTraceSurfaceFeatureEdit(false)} isReadOnly={isReadOnly}/>
        : renderSections()}

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
