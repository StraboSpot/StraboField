import React, {useEffect} from 'react';

import {useDispatch} from 'react-redux';

import RockPage from './RockPage';
import {setSelectedAttributes} from '../spots/spots.slice';

const RockFaultPage = ({isReadOnly, page}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('UE RockFaultPage [page]', page);
    return () => dispatch(setSelectedAttributes([]));
  }, [page]);

  return (
    <RockPage isReadOnly={isReadOnly} page={page}/>
  );
};

export default RockFaultPage;
