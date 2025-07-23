import React, {useState} from 'react';
import {FlatList, Text, View} from 'react-native';

import {ButtonGroup, ListItem, Overlay} from '@rn-vui/base';
import {useDispatch, useSelector} from 'react-redux';

import overlayStyles from './overlay.styles';
import commonStyles from '../../../shared/common.styles';
import {isEmpty, toTitleCase} from '../../../shared/Helpers';
import * as themes from '../../../shared/styles.constants';
import FlatListItemSeparator from '../../../shared/ui/FlatListItemSeparator';
import SwitchWrapper from '../../../shared/ui/Switch';
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

const MapSymbolsOverlay = ({onTouchOutside, overlayStyle, visible}) => {
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
      <ListItem containerStyle={commonStyles.listItemFormField} key={item}>
        <>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>    {getSymbolTitle(item)}</ListItem.Title>
          </ListItem.Content>
          <SwitchWrapper onValueChange={() => toggleGeometryTypesOff(item)} value={!geometryTypesOff.includes(item)}/>
        </>
      </ListItem>
    );
  };

  const renderSymbolsList = ({item, index}) => {
    return (
      <ListItem containerStyle={commonStyles.listItemFormField} key={item}>
        <>
          <ListItem.Content>
            <ListItem.Title style={commonStyles.listItemTitle}>    {getSymbolTitle(item)}</ListItem.Title>
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
    <Overlay
      supportedOrientations={['portrait', 'landscape']}
      animationType={'slide'}
      backdropStyle={{backgroundColor: 'transparent'}}
      isVisible={visible}
      onBackdropPress={onTouchOutside}
      overlayStyle={[overlayStyles.overlayContainer, overlayStyle]}
    >
      <View style={[overlayStyles.titleContainer]}>
        <Text style={[overlayStyles.titleText]}>Map Symbols</Text>
      </View>
      <FlatList
        ListHeaderComponent={
          <>
            {!isEmpty(mapSymbols) && (
              <>
                <ListItem.Accordion
                  key={'feature_types'}
                  containerStyle={commonStyles.listItem}
                  content={
                    <ListItem.Content>
                      <ListItem.Title style={commonStyles.listItemTitle}>Feature Types</ListItem.Title>
                    </ListItem.Content>
                  }
                  isExpanded={isFeatureTypesExpanded}
                  onPress={() => setFeatureTypesExpanded(!isFeatureTypesExpanded)}
                >
                  <FlatListItemSeparator/>
                  <FlatList
                    keyExtractor={item => item}
                    data={mapSymbols}
                    renderItem={renderSymbolsList}
                    ItemSeparatorComponent={FlatListItemSeparator}
                  />
                </ListItem.Accordion>
              </>
            )}

            <ListItem.Accordion
              key={'geometry_types'}
              containerStyle={commonStyles.listItem}
              content={
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Geometry Types</ListItem.Title>
                </ListItem.Content>
              }
              isExpanded={isGeometryTypesExpanded}
              onPress={() => setGeometryTypesExpanded(!isGeometryTypesExpanded)}
            >
              <FlatListItemSeparator/>
              <FlatList
                keyExtractor={item => item}
                data={['points', 'lines', 'polygons']}
                renderItem={renderGeometryTypesList}
                ItemSeparatorComponent={FlatListItemSeparator}
              />
            </ListItem.Accordion>

            <FlatListItemSeparator/>

            <ListItem key={'spotLabels'} containerStyle={commonStyles.listItemFormField}>
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

            <ListItem key={'Only1stMeas'} containerStyle={commonStyles.listItemFormField}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Only 1st Measurements</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={handleShowOnly1stMeas} value={isShowOnly1stMeas}/>
              </>
            </ListItem>

            <FlatListItemSeparator/>

            <ListItem key={'tag_color'} containerStyle={commonStyles.listItemFormField}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Tag Colors</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={toggleShowTagColor} value={tagTypeForColor !== undefined}/>
              </>
            </ListItem>
            {tagTypeForColor && (
              <ButtonGroup
                onPress={i => dispatch(setTagTypeForColor(i === 0 ? 'geologic_unit' : 'concept'))}
                selectedIndex={tagTypeForColor === 'geologic_unit' ? 0 : 1}
                buttons={['Geologic Unit', 'Conceptual']}
                containerStyle={styles.measurementDetailSwitches}
                selectedButtonStyle={{backgroundColor: themes.PRIMARY_ACCENT_COLOR}}
                textStyle={{color: themes.PRIMARY_ACCENT_COLOR}}
              />
            )}

            <FlatListItemSeparator/>

            <ListItem key={'samples'} containerStyle={commonStyles.listItemFormField}>
              <>
                <ListItem.Content>
                  <ListItem.Title style={commonStyles.listItemTitle}>Show Samples</ListItem.Title>
                </ListItem.Content>
                <SwitchWrapper onValueChange={handleShowSamplesOn} value={isShowSamplesOn}/>
              </>
            </ListItem>
          </>
        }
      />
    </Overlay>
  );
};

export default MapSymbolsOverlay;
