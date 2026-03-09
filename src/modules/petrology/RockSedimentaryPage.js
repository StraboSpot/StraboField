import React, {useEffect} from 'react';

import {useDispatch} from 'react-redux';

import RockPage from './RockPage';
import {setSelectedAttributes} from '../spots/spots.slice';

const RockSedimentaryPage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Side Effects */

  useEffect(() => {
    console.log('UE RockSedimentaryPage [page]', page);
    return () => dispatch(setSelectedAttributes([]));
  }, [page]);

  /* View */

  return (
    <RockPage isReadOnly={isReadOnly} page={page}/>
  );
};

export default RockSedimentaryPage;
