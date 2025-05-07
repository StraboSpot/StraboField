import React from 'react';

import {FeatureHalosLayers, FeaturesNotSelectedLayers, FeaturesSelectedLayers} from './index';
import useMapSymbology from '../symbology/useMapSymbology';
import useMapFeatures from '../useMapFeatures';

const FeaturesLayers = ({spotsNotSelected, spotsSelected}) => {

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology} = useMapSymbology();

  // Get selected and not selected Spots as map features, split into multiple features if multiple orientations
  console.log('Getting Spots Not Selected as Features...');
  const spotsNotSelectedWithSymbology = addSymbology(JSON.parse(JSON.stringify(spotsNotSelected)));
  const featuresNotSelected = getSpotsAsFeatures(spotsNotSelectedWithSymbology);
  console.log('Getting Spots Selected as Features...');
  const spotsSelectedWithSymbology = addSymbology(JSON.parse(JSON.stringify(spotsSelected)));
  const featuresSelected = getSpotsAsFeatures(spotsSelectedWithSymbology);

  // Selected point Spots need to be shown in the Unselected Features Layer
  // so we have a point for the selected halo to be around
  const features = [...featuresNotSelected, ...featuresSelected?.filter(
    spot => spot.geometry.type === 'Point') || []];

  return (
    <>
      {/* Halos Around Point Features Layers */}
      <FeatureHalosLayers spotsNotSelected={spotsNotSelectedWithSymbology} spotsSelected={spotsSelectedWithSymbology}/>

      {/* Not Selected Features Layer */}
      <FeaturesNotSelectedLayers features={features}/>

      {/* Selected Features Layer */}
      <FeaturesSelectedLayers featuresSelected={featuresSelected}/>
    </>
  );
};

export default FeaturesLayers;
