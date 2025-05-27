import React, {useEffect, useState} from 'react';

import MapboxGL from '@rnmapbox/maps';
import {useSelector} from 'react-redux';

import {isEmpty} from '../../../shared/Helpers';
import {useImages} from '../../images';
import useMapCoords from '../useMapCoords';

const ImageBasemapLayer = () => {
  const {currentImageBasemap} = useSelector(state => state.map);

  const {getCoordQuad} = useMapCoords();
  const {doesImageExistOnDevice, getLocalImageURI} = useImages();

  const [doesImageExist, setDoesImageExist] = useState(false);

  const coordQuad = getCoordQuad(currentImageBasemap);

  useEffect(() => {
    // console.log('UE Basemap [currentImageBasemap]', currentImageBasemap);
    if (currentImageBasemap && currentImageBasemap.id) checkImageExistence().catch(console.error);
  }, [currentImageBasemap]);

  const checkImageExistence = async () => {
    return doesImageExistOnDevice(currentImageBasemap.id).then(doesExist => setDoesImageExist(doesExist));
  };

  if (currentImageBasemap && !isEmpty(coordQuad) && doesImageExist) {
    return (
      <MapboxGL.ImageSource
        id={'currentImageBasemap'}
        coordinates={coordQuad}
        url={getLocalImageURI(currentImageBasemap.id)}>
        <MapboxGL.RasterLayer
          id={'imageBasemapLayer'}
          style={{rasterOpacity: 1}}
          aboveLayerID={'background'}
        />
      </MapboxGL.ImageSource>
    );
  }
};

export default ImageBasemapLayer;
