import React from 'react';

import {Layer, Source} from 'react-map-gl';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {useImages} from '../../images';
import useMapCoords from '../useMapCoords';

const ImageBasemapLayer = () => {
  const {currentImageBasemap} = useSelector(state => state.map);

  const {getCoordQuad} = useMapCoords();
  const {getImageScreenSizedURI} = useImages();

  const coordQuad = getCoordQuad(currentImageBasemap);

  if (currentImageBasemap && !isEmpty(coordQuad)) {
    return (
      <Source
        coordinates={coordQuad}
        id={'currentImageBasemap'}
        type={'image'}
        url={getImageScreenSizedURI(currentImageBasemap.id)}
      >
        <Layer
          id={'imageBasemapLayer'}
          type={'raster'}
          paint={{'raster-opacity': 1}}
          // beforeId={'pointLayerColorHalo'}
        />
      </Source>
    );
  }
};

export default ImageBasemapLayer;
