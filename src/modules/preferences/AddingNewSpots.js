import React from 'react';
import {FlatList} from 'react-native';

import DrawGeometryToggles from './DrawGeometryToggles';
import ShortcutsList from './ShortcutsList';

const AddingNewSpots = () => {
  return (
    <FlatList
      ListHeaderComponent={
        <>
          <ShortcutsList/>
          <DrawGeometryToggles/>
        </>
      }
    />
  );
};

export default AddingNewSpots;
