import React from 'react';

import {ScaleControl} from 'react-map-gl';
import {useSelector} from 'react-redux';

import {
  CustomOverlayLayers,
  DrawLayers,
  EditLayers,
  FeaturesLayers,
  ImageBasemapLayer,
  MacrostratMarkerLayer,
  MeasureLayers,
} from '.';
import {useWindowSize} from '../../../shared/ui/useWindowSize';
import mapStyles from '../maps.styles';
import CoveredIntervalsXLines from '../strat-section/CoveredIntervalsXLines';
import StratSectionBackground from '../strat-section/StratSectionBackground';

const MapLayers = ({
                     basemap,
                     drawFeatures,
                     editFeatureVertex,
                     isShowMacrostratOverlay,
                     location,
                     measureFeatures,
                     spotsNotSelected,
                     spotsSelected,
                   }) => {

  const {currentImageBasemap, stratSection} = useSelector(state => state.map);

  const useDimensions = useWindowSize();

  return (
    <>
      {/* Displays the marker when Macrostrat view is displayed */}
      {isShowMacrostratOverlay && basemap.id === 'macrostrat' && <MacrostratMarkerLayer location={location}/>}

      {!stratSection && !currentImageBasemap && (
        <ScaleControl
          maxWidth={useDimensions.width * 0.25}
          style={mapStyles.scaleWeb}
          unit={'imperial'}
        />
      )}

      {/* Custom Overlay Layer */}
      {!currentImageBasemap && !stratSection && <CustomOverlayLayers basemap={basemap}/>}

      {/* Strat Section Background Layer */}
      {stratSection && <StratSectionBackground spotsDisplayed={[...spotsNotSelected, ...spotsSelected]}/>}

      {/* Image Basemap Layer */}
      <ImageBasemapLayer/>

      {/* Features Layers */}
      <FeaturesLayers spotsNotSelected={spotsNotSelected} spotsSelected={spotsSelected}/>

      {/* Draw Layer */}
      <DrawLayers drawFeatures={drawFeatures}/>

      {/* Edit Layer */}
      <EditLayers editFeatureVertex={editFeatureVertex}/>

      {/* Strat Section X Lines Layer for Covered/Uncovered or Not Measured Intervals */}
      {stratSection && <CoveredIntervalsXLines spotsDisplayed={[...spotsNotSelected, ...spotsSelected]}/>}

      {/* Measure Layer */}
      <MeasureLayers measureFeatures={measureFeatures}/>
    </>
  );
};

export default MapLayers;
