import React from 'react';

import {FeatureHalosLayers, FeaturesNotSelectedLayers, FeaturesSelectedLayers, SampleLayers} from '.';
import {isEmpty} from '../../../shared/Helpers';
import useProject from '../../project/useProject';
import {MAP_MODES} from '../maps.constants';
import useMapSymbology from '../symbology/useMapSymbology';
import useMapFeatures from '../useMapFeatures';
import FeaturesReadOnlyLayers from './FeaturesReadOnlyLayers';
import {getUniqFeatures} from './layers.helpers';

const FeaturesLayers = ({mapMode, spotsNotSelected, spotsSelected}) => {

  const {getSpotsAsFeatures} = useMapFeatures();
  const {addSymbology} = useMapSymbology();
  const {isSpotInReadOnlyDataset} = useProject();

  // Get selected and not selected Spots as map features, split into multiple features if multiple orientations
  console.log('Getting Spots Not Selected as Features...');
  const spotsNotSelectedWithSymbology = addSymbology(JSON.parse(JSON.stringify(spotsNotSelected)));
  const featuresNotSelected = getSpotsAsFeatures(spotsNotSelectedWithSymbology);
  const featuresNotSelectedUniq = getUniqFeatures(featuresNotSelected);

  console.log('Getting Spots Selected as Features...');
  const spotsSelectedWithSymbology = addSymbology(JSON.parse(JSON.stringify(spotsSelected)));
  const featuresSelected = getSpotsAsFeatures(spotsSelectedWithSymbology);
  const featuresSelectedUniq = getUniqFeatures(featuresSelected);

  // Selected point Spots need to be shown in the Unselected Features Layer
  // so we have a point for the selected halo to be around
  const features = [...featuresNotSelected, ...featuresSelected?.filter(
    spot => spot.geometry.type === 'Point') || []];

  // If in Edit Mode split into Editiable and Read Only features
  const featuresReadOnly = [];
  const featuresEditable = [];
  if (mapMode === MAP_MODES.EDIT) {
    features.forEach((f) => {
      if (isSpotInReadOnlyDataset(f.properties.id)) featuresReadOnly.push(f);
      else featuresEditable.push(f);
    });
  }

  return (
    <>
      {/* Halos Around Point Features Layers */}
      {/* Use unique features so multiple halos are not stacked on top of each other */}
      <FeatureHalosLayers featuresNotSelected={featuresNotSelectedUniq} featuresSelected={featuresSelectedUniq}/>

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
      <FeaturesSelectedLayers featuresSelected={featuresSelected}/>
    </>
  );
};

export default FeaturesLayers;
