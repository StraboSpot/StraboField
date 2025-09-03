import React, {useEffect, useState} from 'react';
import {SectionList, View} from 'react-native';

import {Button, Icon} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import MeasurementDetail from './MeasurementDetail';
import MeasurementItem from './MeasurementItem';
import styles from './measurements.styles';
import useMeasurements from './useMeasurements';
import {isEmpty} from '../../shared/Helpers';
import {PRIMARY_ACCENT_COLOR, WARNING_COLOR} from '../../shared/styles.constants';
import alert from '../../shared/ui/alert';
import FlatListItemSeparator from '../../shared/ui/FlatListItemSeparator';
import ListEmptyText from '../../shared/ui/ListEmptyText';
import NotebookContentTopSection from '../../shared/ui/NotebookContentTopSection';
import SectionDivider from '../../shared/ui/SectionDivider';
import uiStyles from '../../shared/ui/ui.styles';
import {COMPASS_TOGGLE_BUTTONS} from '../compass/compass.constants';
import {setCompassMeasurements, setCompassMeasurementTypes} from '../compass/compass.slice';
import {setModalVisible} from '../home/home.slice';
import {setSelectedAttributes} from '../spots/spots.slice';

const MeasurementsPage = ({page}) => {
  const dispatch = useDispatch();
  const modalVisible = useSelector(state => state.home.modalVisible);
  const spot = useSelector(state => state.spot.selectedSpot);
  const compassMeasurements = useSelector(state => state.compass.measurements);
  const selectedAttributes = useSelector(state => state.spot.selectedAttributes);
  const isMultipleFeaturesTaggingEnabled = useSelector(state => state.project.isMultipleFeaturesTaggingEnabled);

  const [isDetailView, setIsDetailView] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState();
  const [selectedFeaturesTemp, setSelectedFeaturesTemp] = useState([]);

  const {createNewMeasurement, deleteMeasurements} = useMeasurements();

  const SECTIONS = {
    PLANAR: {
      title: 'Planar \nMeasurements',
      keys: ['planar_orientation', 'tabular_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR],
    },
    LINEAR: {
      title: 'Linear \nMeasurements',
      keys: ['linear_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.LINEAR],
    },
    PLANARLINEAR: {
      title: 'Planar + Linear \nMeasurements',
      keys: ['linear_orientation', 'planar_orientation', 'tabular_orientation'],
      compass_toggles: [COMPASS_TOGGLE_BUTTONS.PLANAR, COMPASS_TOGGLE_BUTTONS.LINEAR],
    },
  };

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

  const renderSectionHeader = ({title, data}) => {
    const sectionType = Object.keys(SECTIONS).find(k => SECTIONS[k].title === title);
    return (
      <View style={[styles.measurementsSectionDividerContainer, uiStyles.sectionHeaderBackground]}>
        <SectionDivider dividerText={title}/>
        <View style={styles.measurementsSectionDividerButtonContainer}>
          {multiSelectMode && sectionType === multiSelectMode && (
            <Button
              disabled={isMultipleFeaturesTaggingEnabled}
              onPress={() => onSelectingCancel()}
              title={'Cancel'}
              titleStyle={styles.measurementsSectionDividerButtonText}
              type={'clear'}
            />
          )}
          {multiSelectMode && selectedFeaturesTemp.length >= 1 && sectionType === multiSelectMode && (
            <Button
              disabled={isMultipleFeaturesTaggingEnabled}
              onPress={() => onSelectingEnd()}
              title={'Identify Selected'}
              titleStyle={styles.measurementsSectionDividerButtonText}
              type={'clear'}
            />
          )}
          {!multiSelectMode && (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <>
                <Button
                  disabled={data.length < 1 || isMultipleFeaturesTaggingEnabled}
                  onPress={() => onIdentifyAll(sectionType, data)}
                  title={'Identify All'}
                  titleStyle={styles.measurementsSectionDividerButtonText}
                  type={'clear'}
                />
                <Button
                  disabled={data.length < 1 || isMultipleFeaturesTaggingEnabled}
                  onPress={() => onSelectingStart(sectionType)}
                  title={'Select'}
                  titleStyle={styles.measurementsSectionDividerButtonText}
                  type={'clear'}
                />
              </>
              {!modalVisible && (
                <Button
                  disabled={isMultipleFeaturesTaggingEnabled}
                  icon={
                    <Icon
                      color={PRIMARY_ACCENT_COLOR}
                      name={'add'}
                      size={20}
                      style={{paddingHorizontal: 5}}
                    />
                  }
                  onPress={() => addMeasurement(sectionType)}
                  type={'clear'}
                />
              )}
            </View>
          )}
        </View>
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
        renderItem={({item, i, section}) => (
          <MeasurementItem
            item={item}
            onPress={() => onMeasurementPressed(item, section.title)}
            selectedIds={getIdsOfSelected()}
          />
        )}
        renderSectionFooter={({section}) => {
          return section.data.length === 0 && <ListEmptyText text={'No ' + section.title}/>;
        }}
        renderSectionHeader={({section}) => renderSectionHeader(section)}
        sections={sections}
        stickySectionHeadersEnabled={true}
      />
    );
  };

  const renderMeasurementDetail = () => {
    return (
      <MeasurementDetail
        closeDetailView={() => setIsDetailView(false)}
        page={page}
      />
    );
  };

  const renderMeasurementsMain = () => {
    return (
      <View style={{flex: 1}}>
        <NotebookContentTopSection returnToOverviewAction={() => setModalVisible({modal: null})}/>
        {renderSections()}
        {selectedFeaturesTemp.length >= 1 && (
          <View>
            <Button
              onPress={() => deleteMeasurementsConfirm(selectedFeaturesTemp)}
              title={'Delete Measurement' + (selectedFeaturesTemp.length === 1 ? '' : 's')}
              titleStyle={{color: WARNING_COLOR}}
              type={'clear'}
            />
          </View>
        )}
      </View>
    );
  };

  return isDetailView ? renderMeasurementDetail() : renderMeasurementsMain();
};

export default MeasurementsPage;
