import React, {useMemo, useState} from 'react';

import MapboxGL from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

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

  const isDragIntervalMode = useSelector(state => state.map.isDragIntervalMode);

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology} = useMapSymbology();
  const {isSpotInReadOnlyDataset} = useProject();

  /* Local State */

  const [symbols, setSymbol] = useState({...MAP_SYMBOLS, ...STRAT_PATTERNS});

  /* Derived Variables */

  // Get selected and not selected Spots as features, split into multiple features if multiple orientations
  const featuresNotSelected = useMemo(() => {
    console.log('Getting Spots Not Selected as Features...');
    return getSpotsAsFeatures(addSymbology(spotsNotSelected.map(s => ({...s, properties: {...s.properties}}))));
  }, [spotsNotSelected]);

  const featuresSelected = useMemo(() => {
    console.log('Getting Spots Selected as Features...');
    return getSpotsAsFeatures(addSymbology(spotsSelected.map(s => ({...s, properties: {...s.properties}}))));
  }, [spotsSelected]);

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
      <FeatureHalosLayers
        featuresNotSelected={featuresNotSelectedUniq}
        featuresSelected={isDragIntervalMode ? [] : featuresSelectedUniq}
      />

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
      <FeaturesSelectedLayers
        featuresSelected={isDragIntervalMode ? [] : featuresSelected}
        isStratStyleLoaded={isStratStyleLoaded}
      />
    </>
  );
};

export default FeaturesLayers;
