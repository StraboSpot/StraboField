import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';

import MeasurementDetail from './MeasurementDetail';
import MeasurementItem from './MeasurementItem';
import styles from './measurements.styles';
import useMeasurements from './useMeasurements';
import {isEmpty} from '../../shared/helpers';
import {PRIMARY_ACCENT_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import ClearButton from '../../shared/ui/buttons/ClearButton';
import DeleteButton from '../../shared/ui/buttons/DeleteButton';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import SectionDivider from '../../shared/ui/SectionDivider';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setCompassMeasurements, setCompassMeasurementTypes} from '../compass/compass.slice';
import {setModalVisible} from '../home/home.slice';
import PageHeader from '../page/PageHeader';
import {setSelectedAttributes} from '../spots/spots.slice';

const MeasurementsPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);
  const modalVisible = useSelector(state => state.home.modalVisible);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const spot = useSelector(state => state.spot.selectedSpot);

  const {createNewMeasurement, deleteMeasurements} = useMeasurements();

  /* Local State */

  const [isDetailView, setIsDetailView] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState();
  const [selectedFeaturesTemp, setSelectedFeaturesTemp] = useState([]);

  /* Derived Variables */

  const SECTIONS = {
    PLANAR: {
      title: isReadOnly ? 'Planar Measurements' : 'Planar \nMeasurements',
      keys: ['planar_orientation', 'tabular_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR],
    },
    LINEAR: {
      title: isReadOnly ? 'Linear Measurements' : 'Linear \nMeasurements',
      keys: ['linear_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.LINEAR],
    },
    PLANARLINEAR: {
      title: isReadOnly ? 'Planar + Linear Measurements' : 'Planar + Linear \nMeasurements',
      keys: ['linear_orientation', 'planar_orientation', 'tabular_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR, COMPASS_TOGGLE_BUTTONS.LINEAR],
    },
  };

  /* Side Effects */

  useEffect(() => {
    console.log('UE MeasurementsPage []');
    return () => dispatch(setSelectedAttributes([]));
  }, []);

  useEffect(() => {
    console.log('UE MeasurementsPage [selectedAttributes, spot]', selectedAttributes, spot);
    if (!isMultipleFeaturesTaggingEnabled && selectedAttributes?.length > 0) setIsDetailView(true);
  }, [selectedAttributes, spot]);

  // Create a new measurement on grabbing new compass measurements
  useEffect(() => {
    console.log('UE MeasurementsPage [compassMeasurements]', compassMeasurements);
    if (!isEmpty(compassMeasurements) && !isDetailView) {
      console.log('New compass measurement recorded in Measurements.', compassMeasurements);
      if (compassMeasurements.manual) dispatch(setModalVisible({modal: false}));
      createNewMeasurement();
      dispatch(setCompassMeasurements({}));
    }
  }, [compassMeasurements]);

  /* Event Handlers */

  const onIdentifyAll = (type, data) => {
    console.log('Identify All:', data);
    setMultiSelectMode();
    dispatch(setModalVisible({modal: null}));
    dispatch(setSelectedAttributes(data));
    setIsDetailView(true);
  };

  const onMeasurementPressed = (item, title) => {
    const sectionType = Object.keys(SECTIONS).find(k => SECTIONS[k].title === title);
    console.log('type', sectionType);
    if (!multiSelectMode) editMeasurement([item]);
    else {
      if (sectionType === multiSelectMode && (selectedFeaturesTemp.length === 0
        || (selectedFeaturesTemp.length > 0 && selectedFeaturesTemp[0].type === item.type))) {
        const i = selectedFeaturesTemp.find(selectedFeature => selectedFeature.id === item.id);
        if (i) setSelectedFeaturesTemp(selectedFeaturesTemp.filter(selectedFeature => selectedFeature.id !== item.id));
        else setSelectedFeaturesTemp([...selectedFeaturesTemp, item]);
        console.log('Adding selected feature to identify group ...');
      }
      else alert('Feature type mismatch!');
    }
  };

  const onSelectingCancel = () => {
    setSelectedFeaturesTemp([]);
    setMultiSelectMode();
  };

  const onSelectingEnd = () => {
    console.log('Identify Selected:', selectedFeaturesTemp);
    if (selectedFeaturesTemp.length > 1) dispatch(setModalVisible({modal: null}));
    dispatch(setSelectedAttributes(selectedFeaturesTemp));
    setIsDetailView(true);
  };

  const onSelectingStart = (type) => {
    console.log('Start Selecting for', type, ' ...');
    setSelectedFeaturesTemp([]);
    setMultiSelectMode(type);
  };

  /* Logic Helpers */

  const addMeasurement = (type) => {
    dispatch(setCompassMeasurementTypes(SECTIONS[type].compass_toggles));
    dispatch(setModalVisible({modal: page.key}));
  };

  const deleteMeasurementsConfirm = (measurementsToDelete) => {
    const deleteText = 'Are you sure you want to delete '
      + (measurementsToDelete.length === 1 ? 'this measurement' : 'these measurements') + '?';
    alert(
      'Delete Measurement',
      deleteText,
      [{
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      }, {
        text: 'OK',
        onPress: () => deleteMeasurementsCont(measurementsToDelete),
      }],
      {cancelable: false},
    );
  };

  const deleteMeasurementsCont = (measurementsToDelete) => {
    deleteMeasurements(measurementsToDelete);
    onSelectingCancel();
  };

  const editMeasurement = (measurements) => {
    setIsDetailView(true);
    dispatch(setSelectedAttributes(measurements));
    if (measurements.length > 1) dispatch(setModalVisible({modal: null}));
  };

  const getIdsOfSelected = () => {
    return selectedFeaturesTemp.map(value => value.id);
  };

  /* Render Functions */

  const renderMeasurementDetail = () => {
    return (
      <MeasurementDetail
        closeDetailView={() => setIsDetailView(false)}
        isReadOnly={isReadOnly}
        page={page}
      />
    );
  };

  const renderMeasurementsMain = () => {
    return (
      <View style={{flex: 1}}>
        <PageHeader pageTitle={page.label} showFeaturesTagButton={!isReadOnly && !multiSelectMode}/>
        {renderSections()}
        {selectedFeaturesTemp.length >= 1 && (
          <View>
            <DeleteButton
              onPress={() => deleteMeasurementsConfirm(selectedFeaturesTemp)}
              title={'Delete Measurement' + (selectedFeaturesTemp.length === 1 ? '' : 's')}
            />
          </View>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({title, data}) => {
    const sectionType = Object.keys(SECTIONS).find(k => SECTIONS[k].title === title);
    return (
      <View style={styles.measurementsSectionDividerContainer}>
        <SectionDivider dividerText={title}/>
        {!isReadOnly && (
          <View style={styles.measurementsSectionDividerButtonContainer}>
            {multiSelectMode && sectionType === multiSelectMode && (
              <ClearButton
                disabled={isMultipleFeaturesTaggingEnabled}
                onPress={onSelectingCancel}
                title={'Cancel'}
              />
            )}
            {multiSelectMode && selectedFeaturesTemp.length >= 1 && sectionType === multiSelectMode && (
              <ClearButton
                disabled={isMultipleFeaturesTaggingEnabled}
                onPress={onSelectingEnd}
                title={'Identify Selected'}
              />
            )}
            {!multiSelectMode && (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <>
                  <ClearButton
                    disabled={data.length < 1 || isMultipleFeaturesTaggingEnabled}
                    onPress={() => onIdentifyAll(sectionType, data)}
                    title={'Identify All'}
                  />
                  <ClearButton
                    disabled={data.length < 1 || isMultipleFeaturesTaggingEnabled}
                    onPress={() => onSelectingStart(sectionType)}
                    title={'Select'}
                  />
                </>
                {!modalVisible && (
                  <ClearButton
                    disabled={isMultipleFeaturesTaggingEnabled}
                    icon={{
                      color: PRIMARY_ACCENT_COLOR,
                      name: 'add',
                      size: 20,
                    }}
                    onPress={() => addMeasurement(sectionType)}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSections = () => {
    const sections = Object.values(SECTIONS).reduce((acc, {title, keys}) => {
      const data = spot?.properties?.orientation_data?.filter((meas) => {
        return ((keys.length !== 3 && !meas?.associated_orientation)
          || (keys.length === 3 && meas?.associated_orientation)) && keys.includes(meas?.type);
      }) || [];
      return [...acc, {title: title, data: data.reverse()}];
    }, []);

    return (
      <SectionList
        ItemSeparatorComponent={FlatListItemSeparator}
        keyExtractor={(item, index) => item + index}
        renderItem={({item, section}) => {
          const sectionType = Object.keys(SECTIONS).find(k => SECTIONS[k].title === section.title);
          return (
            <MeasurementItem
              isSelectMode={multiSelectMode === sectionType}
              item={item}
              onPress={() => onMeasurementPressed(item, section.title)}
              selectedIds={getIdsOfSelected()}
            />
          );
        }}
        renderSectionFooter={({section}) => {
          const sectionType = Object.keys(SECTIONS).find(k => SECTIONS[k].title === section.title);
          return (
            section.data.length === 0 && (
              <ListEmptyText
                onPress={!isReadOnly && !modalVisible && (() => addMeasurement(sectionType))}
                text={'No ' + section.title}
              />
            )
          );
        }}
        renderSectionHeader={({section}) => renderSectionHeader(section)}
        sections={sections}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  /* View */

  return isDetailView ? renderMeasurementDetail() : renderMeasurementsMain();
};

export default MeasurementsPage;
