import React from 'react';

import {useSelector} from 'react-redux';

import StratSectionImageOverlay from './StratSectionImageOverlay';
import XAxes from './XAxes';
import YAxis from './YAxis';
import {useImages} from '../../images';
import {useSpots} from '../../spots';
import useMapCoords from '../useMapCoords';

const StratSectionBackground = ({spotsDisplayed}) => {
  console.log('Rendering StratSectionBackground...');

  const stratSection = useSelector(state => state.map.stratSection);

  const {getLocalImageURI} = useImages();
  const {getCoordQuad} = useMapCoords();
  const {getSpotWithThisStratSection} = useSpots();

  const renderImageOverlays = () => {
    const stratSectionSpot = getSpotWithThisStratSection(stratSection.strat_section_id);
    const stratSectionImagesSorted = JSON.parse(JSON.stringify(stratSection.images || [])).sort(
      (a, b) => a.z_index - b.z_index);

    return stratSectionSpot && stratSectionImagesSorted.map((oI) => {
      const image = stratSectionSpot.properties.images.find(i => i.id === oI.id);
      let imageCopy = JSON.parse(JSON.stringify(image));
      if (oI.image_height) imageCopy.height = oI.image_height;
      if (oI.image_width) imageCopy.width = oI.image_width;
      // coordQuad = [topLeft, topRight, bottomRight, bottomLeft];
      const coordQuad = getCoordQuad(imageCopy, {x: oI.image_origin_x, y: oI.image_origin_y});
      console.log('Image Overlay coordQuad', coordQuad);
      const url = getLocalImageURI(image.id);
      return (
        <StratSectionImageOverlay
          key={'imageOverlay' + oI.id}
          id={oI.id}
          coordQuad={coordQuad}
          url={url}
          imageOpacity={oI.image_opacity}
        />
      );
    });
  };

  return (
    <>
      {/* Image Overlay Layers */}
      {renderImageOverlays()}

      {/* Y Axis */}
      <YAxis spotsDisplayed={spotsDisplayed}/>

      {/* X Axes */}
      {<XAxes/>}
    </>
  );
};

export default StratSectionBackground;
