import React from 'react';

import {useSelector} from 'react-redux';

import XAxis from './XAxis';

const XAxes = () => {
  /* Data Hooks */

  const stratSection = useSelector(state => state.map.stratSection);

  /* View */

  return (
    <>
      <XAxis/>
      {stratSection?.column_profile === 'mixed_clastic' ? (
        <>
          <XAxis n={2}/>
          {stratSection?.misc_labels && <XAxis n={3}/>}
        </>
      ) : (
        stratSection?.misc_labels && <XAxis n={2}/>
      )}
    </>
  );
};

export default XAxes;
