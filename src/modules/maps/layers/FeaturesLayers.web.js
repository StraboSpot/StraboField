import React, {useMemo} from 'react';

import {useSelector} from 'react-redux';

import {FeatureHalosLayers, FeaturesNotSelectedLayers, FeaturesSelectedLayers, SampleLayers} from '.';
import {isEmpty} from '../../../shared/helpers';
import useProject from '../../project/useProject';
import {MAP_MODES} from '../maps.constants';
import useMapSymbology from '../symbology/useMapSymbology';
import useMapFeatures from '../useMapFeatures';
import FeaturesReadOnlyLayers from './FeaturesReadOnlyLayers';
import {getUniqFeatures} from './layers.helpers';

const FeaturesLayers = ({mapMode, spotsNotSelected, spotsSelected}) => {
  /* Data Hooks */

  const featureTypesOff = useSelector(state => state.map.featureTypesOff) || [];
  const geometryTypesOff = useSelector(state => state.map.geometryTypesOff) || [];
  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);
  const isShowOnly1stMeas = useSelector(state => state.map.isShowOnly1stMeas);
  const labelTypeOn = useSelector(state => state.map.labelTypeOn);
  const stratSection = useSelector(state => state.map.stratSection);
  const tagTypeForColor = useSelector(state => state.map.tagTypeForColor);

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology} = useMapSymbology();
  const {isReadOnlySpot} = useProject();

  /* Derived Variables */

  // Get selected and not selected Spots as map features, split into multiple features if multiple orientations
  const featuresNotSelected = useMemo(() => {
    console.log('Getting Spots Not Selected as Features...');
    return getSpotsAsFeatures(addSymbology(spotsNotSelected.map(s => ({...s, properties: {...s.properties}}))));
  }, [spotsNotSelected, stratSection, featureTypesOff, geometryTypesOff, isShowOnly1stMeas, labelTypeOn, tagTypeForColor]);

  const featuresSelected = useMemo(() => {
    console.log('Getting Spots Selected as Features...');
    return getSpotsAsFeatures(addSymbology(spotsSelected.map(s => ({...s, properties: {...s.properties}}))));
  }, [spotsSelected, stratSection, featureTypesOff, geometryTypesOff, isShowOnly1stMeas, labelTypeOn, tagTypeForColor]);

  // Selected point Spots need to be shown in the Unselected Features Layer
  // so we have a point for the selected halo to be around
  const features = [...featuresNotSelected, ...featuresSelected?.filter(spot => spot.geometry.type === 'Point') || []];

  // If in Edit Mode split into Editiable and Read Only features
  const featuresEditable = [];
  const featuresReadOnly = [];
  if (mapMode === MAP_MODES.EDIT) {
    features.forEach((f) => {
      if (isReadOnlySpot(f.properties.id)) featuresReadOnly.push(f);
      else featuresEditable.push(f);
    });
  }

  const featuresNotSelectedUniq = getUniqFeatures(featuresNotSelected);
  const featuresSelectedUniq = getUniqFeatures(featuresSelected);

  /* View */

  return (
    <>
      {/* Halos Around Point Features Layers */}
      {/* Use unique features so multiple halos are not stacked on top of each other */}
      <FeatureHalosLayers
        featuresNotSelected={featuresNotSelectedUniq}
        featuresSelected={isDragIntervalMode ? [] : featuresSelectedUniq}
      />

      <SampleLayers features={features}/>

      {/* Not Selected Features Layer */}
      {isEmpty(featuresReadOnly) ? <FeaturesNotSelectedLayers features={features}/>
        : (
          <>
            {/* Editable & Read Only Features Layers */}
            <FeaturesNotSelectedLayers features={featuresEditable}/>
            <FeaturesReadOnlyLayers features={featuresReadOnly}/>
          </>
        )}

      {/* Selected Features Layer */}
      <FeaturesSelectedLayers featuresSelected={isDragIntervalMode ? [] : featuresSelected}/>
    </>
  );
};

export default FeaturesLayers;
