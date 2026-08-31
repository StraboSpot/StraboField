import React from 'react';

import {useSelector} from 'react-redux';

import {getImageOverlayOpacity} from './stratSection.helpers';
import StratSectionImageOverlay from './StratSectionImageOverlay';
import XAxes from './XAxes';
import YAxis from './YAxis';
import {getLocalImageURI} from '../../images/imageURIs.helpers';
import {useSpots} from '../../spots';
import useMapCoords from '../view/useMapCoords';

const StratSectionBackground = () => {
  console.log('Rendering StratSectionBackground...');

  /* Data Hooks */

  const stratSection = useSelector(state => state.map.stratSection);

  const {getCoordQuad} = useMapCoords();
  const {getSpotWithThisStratSection} = useSpots();

  /* Render Functions */

  // Every overlay names the layer it sits below, which pins the group to the bottom of the stack with the axes and
  // everything else drawn over it. Highest draw order first: that one goes below the axes and each of the rest below
  // the one before it, so an overlay's anchor always exists by the time it is added - which web requires, since it
  // cannot anchor to a layer that is not there yet. A missing draw order counts as 0 rather than sorting undefined.
  const renderImageOverlays = () => {
    const stratSectionSpot = getSpotWithThisStratSection(stratSection.strat_section_id);
    const stratSectionImagesSorted = JSON.parse(JSON.stringify(stratSection.images || [])).sort(
      (a, b) => (b.z_index || 0) - (a.z_index || 0));

    return stratSectionSpot && stratSectionImagesSorted.map((oI, index) => {
      const image = stratSectionSpot.properties.images.find(i => i.id === oI.id);
      let imageCopy = JSON.parse(JSON.stringify(image));
      if (oI.image_height) imageCopy.height = oI.image_height;
      if (oI.image_width) imageCopy.width = oI.image_width;
      // coordQuad = [topLeft, topRight, bottomRight, bottomLeft];
      const coordQuad = getCoordQuad(imageCopy, {x: oI.image_origin_x, y: oI.image_origin_y});
      console.log('Image Overlay coordQuad', coordQuad);
      // Versioned through the key, not the url — Mapbox reads a file:// url as a path, query and all
      const url = getLocalImageURI(image.id);
      return (
        <StratSectionImageOverlay
          belowLayerId={index === 0 ? 'yAxisLayer' : 'imageOverlayLayer' + stratSectionImagesSorted[index - 1].id}
          coordQuad={coordQuad}
          id={oI.id}
          imageOpacity={getImageOverlayOpacity(oI.image_opacity)}
          key={'imageOverlay' + oI.id + (image.modified_timestamp || '')}
          url={url}
        />
      );
    });
  };

  /* View */

  return (
    <>
      {/* Y Axis */}
      <YAxis/>

      {/* X Axes */}
      <XAxes/>

      {/* Image Overlay Layers, added after the axes so they have yAxisLayer to anchor themselves below */}
      {renderImageOverlays()}
    </>
  );
};

export default StratSectionBackground;
