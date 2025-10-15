import React, {useState} from 'react';
import {FlatList} from 'react-native';

import {ButtonGroup, ListItem} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import {overlayStyles} from './index';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import {SMALL_SCREEN} from '../../../shared/styles.constants';
import {SwitchWrapper} from '../../../shared/ui/';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import ModalWrapper from '../../../shared/ui/modals/ModalWrapper';
import {
  setFeatureTypesOff,
  setGeometryTypesOff,
  setIsShowOnly1stMeas,
  setIsShowSamplesOn,
  setLabelTypeOn,
  setTagTypeForColor,
} from '../../maps/maps.slice';
import styles from '../../measurements/measurements.styles';
import useMeasurements from '../../measurements/useMeasurements';

const MapSymbolsOverlay = ({onTouchOutside, visible}) => {
  const dispatch = useDispatch();
  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const isShowOnly1stMeas = useSelector(state => state.map.isShowOnly1stMeas);
  const isShowSamplesOn = useSelector(state => state.map.isShowSamplesOn);
  const labelTypeOn = useSelector(state => state.map.labelTypeOn);
  const mapSymbols = useSelector(state => state.map.mapSymbols);
  const tagTypeForColor = useSelector(state => state.map.tagTypeForColor);

  const [isFeatureTypesExpanded, setFeatureTypesExpanded] = useState(true);
  const [isGeometryTypesExpanded, setGeometryTypesExpanded] = useState(true);

  const {getMeasurementLabel} = useMeasurements();

  const getSymbolTitle = symbol => toTitleCase(getMeasurementLabel(symbol));

  const handleShowOnly1stMeas = () => dispatch(setIsShowOnly1stMeas(!isShowOnly1stMeas));

  const handleShowSamplesOn = () => dispatch(setIsShowSamplesOn(!isShowSamplesOn));

  const renderGeometryTypesList = ({item, index}) => {
    return (
      <ListItem containerStyle={[
        commonStyles.listItemFormField,
        SMALL_SCREEN && {
          // minHeight: 50,
          paddingVertical: 15,
          paddingHorizontal: 20,
        },
      ]} key={item}>
        <>
          <ListItem.Content>
            <ListItem.Title style={[
              commonStyles.listItemTitle,
              SMALL_SCREEN && {
                fontSize: 16,
                fontWeight: '500',
              },
            ]}>    {getSymbolTitle(item)}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper onValueChange={() => toggleGeometryTypesOff(item)} value={!geometryTypesOff.includes(item)}/>
        </>
      </ListItem>
    );
  };

  const renderSymbolsList = ({item, index}) => {
    return (
      <ListItem containerStyle={[
        commonStyles.listItemFormField,
        SMALL_SCREEN && {
          minHeight: 50,
          paddingVertical: 15,
          paddingHorizontal: 20,
        },
      ]} key={item}>
        <>
          <ListItem.Content>
            <ListItem.Title style={[
              commonStyles.listItemTitle,
              SMALL_SCREEN && {
                fontSize: 16,
                fontWeight: '500',
              },
            ]}>    {getSymbolTitle(item)}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper onValueChange={() => toggleFeatureTypesOff(item)} value={!featureTypesOff.includes(item)}/>
        </>
      </ListItem>
    );
  };

  const toggleGeometryTypesOff = (geometryType) => {
    let geometryTypesOffCopy = [...geometryTypesOff];
    const i = geometryTypesOffCopy.indexOf(geometryType);
    if (i === -1) geometryTypesOffCopy.push(geometryType);
    else geometryTypesOffCopy.splice(i, 1);
    dispatch(setGeometryTypesOff(geometryTypesOffCopy));
  };

  const toggleFeatureTypesOff = (featureType) => {
    let featureTypesOffCopy = [...featureTypesOff];
    const i = featureTypesOffCopy.indexOf(featureType);
    if (i === -1) featureTypesOffCopy.push(featureType);
    else featureTypesOffCopy.splice(i, 1);
    dispatch(setFeatureTypesOff(featureTypesOffCopy));
  };

  const toggleLabelTypeOn = () => {
    if (labelTypeOn) dispatch(setLabelTypeOn(undefined));
    else dispatch(setLabelTypeOn('dip'));
  };

  const toggleShowTagColor = () => {
    if (tagTypeForColor) dispatch(setTagTypeForColor(undefined));
    else dispatch(setTagTypeForColor('geologic_unit'));
  };

  return (
    <ModalWrapper
      closeModal={onTouchOutside}
      fullscreen={SMALL_SCREEN}
      headerTitle={'Map Symbols'}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyleOverride={overlayStyles.overlayMapMenuPosition}
      showActionButton={false}
      showCancelButton={false}
      showCloseButton={SMALL_SCREEN}
    >
      <FlatList
        ListHeaderComponent={
          <>
            {!isEmpty(mapSymbols) && (
              <>
                <ListItem.Accordion
                  containerStyle={commonStyles.listItem}
                  content={
                    <ListItem.Content>
                      <ListItem.Title style={commonStyles.listItemTitle}>Feature Types</ListItem.Title>
                    </ListItem.Content>
                  }
                  isExpanded={isFeatureTypesExpanded}
                  key={'feature_types'}
                  onPress={() => setFeatureTypesExpanded(!isFeatureTypesExpanded)}
                >
                  <FlatListItemSeparator/>
                  <FlatList
                    ItemSeparatorComponent={FlatListItemSeparator}
                    data={mapSymbols}
                    keyExtractor={item => item}
                    renderItem={renderSymbolsList}
                  />
                </ListItem.Accordion>
              </>
            )}

            <ListItem.Accordion
              containerStyle={commonStyles.listItem}
              content={
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Geometry Types</ListItem.Title>
                </ListItem.Content>
              }
              isExpanded={isGeometryTypesExpanded}
              key={'geometry_types'}
              onPress={() => setGeometryTypesExpanded(!isGeometryTypesExpanded)}
            >
              <FlatListItemSeparator/>
              <FlatList
                ItemSeparatorComponent={FlatListItemSeparator}
                data={['points', 'lines', 'polygons']}
                keyExtractor={item => item}
                renderItem={renderGeometryTypesList}
              />
            </ListItem.Accordion>

            <FlatListItemSeparator/>

            <ListItem containerStyle={commonStyles.listItemFormField} key={'spotLabels'}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Labels</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={toggleLabelTypeOn} value={labelTypeOn !== undefined}/>
              </>
            </ListItem>
            {labelTypeOn && (
              <ButtonGroup
                buttons={['Dip/Plunge', 'Spot Name']}
                containerStyle={styles.measurementDetailSwitches}
                onPress={i => dispatch(setLabelTypeOn(i === 0 ? 'dip' : 'name'))}
                selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
                selectedIndex={labelTypeOn === 'dip' ? 0 : 1}
                textStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: themes.SMALL_TEXT_SIZE}}
              />
            )}

            <FlatListItemSeparator/>

            <ListItem containerStyle={commonStyles.listItemFormField} key={'Only1stMeas'}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Only 1st Measurements</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={handleShowOnly1stMeas} value={isShowOnly1stMeas}/>
              </>
            </ListItem>

            <FlatListItemSeparator/>

            <ListItem containerStyle={commonStyles.listItemFormField} key={'tag_color'}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Tag Colors</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={toggleShowTagColor} value={tagTypeForColor !== undefined}/>
              </>
            </ListItem>
            {tagTypeForColor && (
              <ButtonGroup
                buttons={['Geologic Unit', 'Conceptual']}
                containerStyle={styles.measurementDetailSwitches}
                onPress={i => dispatch(setTagTypeForColor(i === 0 ? 'geologic_unit' : 'concept'))}
                selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
                selectedIndex={tagTypeForColor === 'geologic_unit' ? 0 : 1}
                textStyle={{color: themes.PRIMARY_ACCENT_COLOR, fontSize: themes.SMALL_TEXT_SIZE}}
              />
            )}

            <FlatListItemSeparator/>

            <ListItem containerStyle={commonStyles.listItemFormField} key={'samples'}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Show Samples</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={handleShowSamplesOn} value={isShowSamplesOn}/>
              </>
            </ListItem>
          </>
        }
        contentContainerStyle={{
          paddingVertical: SMALL_SCREEN ? 20 : 0,
          flexGrow: SMALL_SCREEN ? 1 : 0,
        }}
        style={{width: '100%'}}
      />
    </ModalWrapper>
  );
};

export default MapSymbolsOverlay;
