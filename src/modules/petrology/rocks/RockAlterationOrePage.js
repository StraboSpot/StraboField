import React, {useEffect} from 'react';

import {useDispatch} from 'react-redux';

import RocksPage from './RocksPage';
import {setSelectedAttributes} from '../../spots/spots.slice';

const RockAlterationOrePage = ({isReadOnly, page}) => {
  /* Data Hooks */

  const dispatch = useDispatch();

  /* Side Effects */

  useEffect(() => {
    console.log('UE RockAlterationOrePage [page]', page);
    return () => dispatch(setSelectedAttributes([]));
  }, [page]);

  /* View */

  return (
    <RocksPage isReadOnly={isReadOnly} page={page}/>
  );
};

export default RockAlterationOrePage;
