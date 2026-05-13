import React from 'react';

import {Layer, Source} from 'react-map-gl/mapbox';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/helpers';
import {useWindowSize} from '../../../shared/ui/useWindowSize';
import {getResizedImageURI} from '../../images/imageURIs.helpers';
import useMapCoords from '../useMapCoords';

const ImageBasemapLayer = () => {
  const {currentImageBasemap} = useSelector(state => state.map);

  const {getCoordQuad} = useMapCoords();
  const {width, height} = useWindowSize();

  const coordQuad = getCoordQuad(currentImageBasemap);

  if (currentImageBasemap && !isEmpty(coordQuad)) {
    return (
      <Source
        coordinates={coordQuad}
        id={'currentImageBasemap'}
        type={'image'}
        url={getResizedImageURI(currentImageBasemap.id, width, height)}
      >
        <Layer
          // beforeId={'pointLayerColorHalo'}
          id={'imageBasemapLayer'}
          paint={{'raster-opacity': 1}}
          type={'raster'}
        />
      </Source>
    );
  }
};

export default ImageBasemapLayer;
