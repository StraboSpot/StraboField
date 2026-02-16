import {useEffect, useState} from 'react';

import {useImages} from './index';
import {isEmpty} from '../../shared/Helpers';

const useImageThumbnails = ({images}) => {
  /* Data Hooks / State */

  const {getImageThumbnailURIs} = useImages();

  const [areImageThumbnailsLoading, setAreImageThumbnailsLoading] = useState({});
  const [imageThumbnailURIs, setImageThumbnailURIs] = useState({});

  /* Side Effects */

  useEffect(() => {
    console.log('UE ImageThumbnail []');
    if (!isEmpty(images)) loadImageThumbnailURIs().catch(err => console.error(err));
  }, [images]);

  /* Internal Functions */

  const loadImageThumbnailURIs = async () => {
    try {
      console.log('Getting Image URI Thumbnails for Images:', images);
      setAreImageThumbnailsLoading(Object.assign({}, ...images.map(image => ({[image.id]: true}))));
      const gotImageThumbnailURIs = await getImageThumbnailURIs(images);
      console.log('Got Image Thumbnail URIs:', gotImageThumbnailURIs);
      setAreImageThumbnailsLoading(Object.assign({},
        ...Object.keys(gotImageThumbnailURIs).map(key => ({[key]: !isEmpty(gotImageThumbnailURIs[key])}))));
      setImageThumbnailURIs(gotImageThumbnailURIs);
    }
    catch (err) {
      console.error('Error getting image thumbnail URIs', err);
      setAreImageThumbnailsLoading(Object.assign({}, ...images.map(image => ({[image.id]: false}))));
    }
  };

  return {
    areImageThumbnailsLoading,
    imageThumbnailURIs,
    setAreImageThumbnailsLoading,
    setImageThumbnailURIs,
  };
};

export default useImageThumbnails;
