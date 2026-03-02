import React, {useState} from 'react';

import MapboxGL from '@rnmapbox/maps';

import {FeatureHalosLayers, FeaturesNotSelectedLayers, FeaturesSelectedLayers, SampleLayers} from './index';
import {isEmpty} from '../../../shared/Helpers';
import useProject from '../../project/useProject';
import {MAP_MODES} from '../maps.constants';
import {STRAT_PATTERNS} from '../strat-section/stratSection.constants';
import {MAP_SYMBOLS} from '../symbology/mapSymbology.constants';
import useMapSymbology from '../symbology/useMapSymbology';
import useMapFeatures from '../useMapFeatures';
import FeaturesReadOnlyLayers from './FeaturesReadOnlyLayers';
import {getUniqFeatures} from './layers.helpers';

const FeaturesLayers = ({isStratStyleLoaded, mapMode, spotsNotSelected, spotsSelected}) => {
  /* Data Hooks */

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology} = useMapSymbology();
  const {isSpotInReadOnlyDataset} = useProject();

  /* Local State */

  const [symbols, setSymbol] = useState({...MAP_SYMBOLS, ...STRAT_PATTERNS});

  /* Derived Variables */

  // Get selected and not selected Spots as features, split into multiple features if multiple orientations
  const spotsNotSelectedWithSymbology = addSymbology(spotsNotSelected.map(s => ({...s, properties: {...s.properties}})));
  const spotsSelectedWithSymbology = addSymbology(spotsSelected.map(s => ({...s, properties: {...s.properties}})));

  console.log('Getting Spots Not Selected as Features...');
  const featuresNotSelected = getSpotsAsFeatures(spotsNotSelectedWithSymbology);
  console.log('Getting Spots Selected as Features...');
  const featuresSelected = getSpotsAsFeatures(spotsSelectedWithSymbology);

  // Selected point Spots need to be shown in the Unselected Features Layer
  // so we have a point for the selected halo to be around
  const features = [...featuresNotSelected, ...featuresSelected?.filter(spot => spot.geometry.type === 'Point') || []];

  // If in Edit Mode split into Editiable and Read Only features
  const featuresEditable = [];
  const featuresReadOnly = [];
  if (mapMode === MAP_MODES.EDIT) {
    features.forEach((f) => {
      if (isSpotInReadOnlyDataset(f.properties.id)) featuresReadOnly.push(f);
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
      <FeatureHalosLayers featuresNotSelected={featuresNotSelectedUniq} featuresSelected={featuresSelectedUniq}/>

      <SampleLayers features={features}/>

      <MapboxGL.Images
        images={symbols}
        onImageMissing={(imageKey) => {
          setSymbol({...symbols, [imageKey]: symbols.default_point});
        }}
      />

      {/* Not Selected Features Layer */}
      {isEmpty(featuresReadOnly) ? (
        <FeaturesNotSelectedLayers features={features} isStratStyleLoaded={isStratStyleLoaded}/>
      ) : (
        <>
          {/* Editable & Read Only Features Layers */}
          <FeaturesNotSelectedLayers features={featuresEditable} isStratStyleLoaded={isStratStyleLoaded}/>
          <FeaturesReadOnlyLayers features={featuresReadOnly}/>
        </>
      )}

      {/* Selected Features Layer */}
      <FeaturesSelectedLayers featuresSelected={featuresSelected} isStratStyleLoaded={isStratStyleLoaded}/>
    </>
  );
};

export default FeaturesLayers;
